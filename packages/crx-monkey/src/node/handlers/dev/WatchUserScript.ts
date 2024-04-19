import { ManifestFactory } from 'src/node/manifest-factory';
import { Watch, WatchImplements } from './Watch';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import {
  createMatchMap,
  getAllJsAndCSSByContentScripts,
  geti18nMessages,
} from 'src/node/manifest-factory/utils';
import {
  convertChromeRunAtToUserJsRunAt,
  convertImgToBase64,
} from 'src/node/userscript-header-factory/utils';
import { BuildResult } from 'esbuild';
import fse from 'fs-extra';
import path from 'path';
import { ReloadServer } from './server/reloadServer';

export class WatchUserScript extends Watch implements WatchImplements {
  private readonly headerFactory: UserscriptHeaderFactory;
  private buildResultStore: Record<string, Uint8Array> = {};
  private cssResultStore: Record<string, Buffer> = {};

  constructor(
    manifest: chrome.runtime.ManifestV3,
    manifestFactory: ManifestFactory,
    headerFactory: UserscriptHeaderFactory,
    reloadServer: ReloadServer,
  ) {
    super(manifest, manifestFactory, reloadServer);

    this.headerFactory = headerFactory;
    this.reloadServer;
  }

  public async watch() {
    if (this.config.devServer === undefined) {
      throw new Error('Dev Server is not enabled');
    }

    const contentScripts = this.manifest.content_scripts;
    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      const { matchMap, allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

      await this.headerRegister(allMatches);

      this.loadContentCssFiles(cssFiles);

      await this.watchByJsFilePaths(
        jsFiles,
        (...args) => {
          this.watchJsOnBuild(...args);
          this.outputFile(matchMap);
        },
        { write: false },
        () => {},
      );

      this.watchByCssPaths(cssFiles, () => {
        this.loadContentCssFiles(cssFiles);
        this.outputFile(matchMap);
      });
    }
  }

  /**
   * Register meta data to userscript header factory.
   * @param allMatches
   * @param unsafeWindow
   */
  private async headerRegister(allMatches: string[]) {
    /**
     * Set all match to header.
     */
    allMatches.forEach((match) => {
      this.headerFactory.push('@match', match);
    });

    /**
     * Set version designation by manifest to header.
     */
    this.headerFactory.push('@version', this.manifest.version);

    if (this.manifest.run_at !== undefined) {
      this.headerFactory.push('@run-at', convertChromeRunAtToUserJsRunAt(this.manifest.run_at));
    }

    /**
     * Set name.
     * If can not found locale message, even if language key is not en, it will be en.
     */
    const names = await geti18nMessages(this.manifest.name);
    Object.keys(names).forEach((lang) => {
      if (lang === 'en') {
        // default is en.
        this.headerFactory.push('@name', names[lang]);
      } else {
        this.headerFactory.push(`@name:${lang}`, names[lang]);
      }
    });

    /**
     * Set description.
     * If can not found locale message, even if language key is not en, it will be en.
     */
    if (this.manifest.description !== undefined) {
      const descriptions = await geti18nMessages(this.manifest.description);
      Object.keys(descriptions).forEach((lang) => {
        if (lang === 'en') {
          this.headerFactory.push('@description', descriptions[lang]);
        } else {
          this.headerFactory.push(`@description:${lang}`, descriptions[lang]);
        }
      });
    }

    const configHeader = this.config.userScriptHeader;
    if (configHeader !== undefined) {
      configHeader.forEach((configHeaderItem) => {
        // If key is not @grant and already exists it in header, it replace value into configHeaderItem[1].
        if (this.headerFactory.exist(configHeaderItem[0]) && configHeaderItem[0] !== '@grant') {
          this.headerFactory.replace(configHeaderItem[0], configHeaderItem[1]);
        } else {
          // If key is @grant and already exists it in header, add an add additional it.
          this.headerFactory.push(configHeaderItem[0], configHeaderItem[1]);
        }
      });
    }

    /**
     * Add icon of 48size that converted to base64 in manifest.json to userscript.
     */
    if (this.config.importIconToUsercript) {
      const icons = this.manifest.icons;

      if (icons !== undefined) {
        const icon48 = icons['48'];
        if (icon48 !== undefined) {
          const iconPath = path.join(path.dirname(this.config.manifestJsonPath!), icon48);
          const base64 = convertImgToBase64(iconPath);
          this.headerFactory.push('@icon', base64);
        } else {
          throw new Error('No size 48 icons were found in the icons item');
        }
      } else {
        throw new Error(
          [
            'No "icons" entry found in manifest',
            'Disable the "importIconToUserscript" entry in the config file or add an "icons" entry to manifest',
          ].join('\n'),
        );
      }
    }
  }

  private watchJsOnBuild(result: BuildResult, jsFilePath: string) {
    const { outputFiles } = result;

    if (outputFiles !== undefined) {
      this.buildResultStore[jsFilePath] = outputFiles[0].contents;
    }
  }

  /**
   * Build content scripts for each match and generate code to restrict execution for each match using if
   * @param matchMap
   * @param jsBuildResultStore
   * @param cssResultStore
   * @returns
   */
  private generateContentScriptcode(
    matchMap: Record<string, string[]>,
    jsBuildResultStore: Record<string, Uint8Array>,
    cssResultStore: Record<string, Buffer>,
  ) {
    // script result tmp.
    let scriptContent = '';

    Object.keys(matchMap).forEach((filePath) => {
      const matches = matchMap[filePath];

      // Start conditional statement of if for branch of href.
      scriptContent = scriptContent + 'if (';

      // Does this contentscript have multiple match href?
      let isOr = false;

      matches.forEach((matchPattern) => {
        scriptContent =
          scriptContent + `${isOr ? ' ||' : ''}location.href.match('${matchPattern}') !== null`;

        isOr = true;
      });

      // End conditional statement.
      scriptContent = scriptContent + ') {\n';

      if (jsBuildResultStore[filePath] !== undefined) {
        const buildResultText = new TextDecoder().decode(jsBuildResultStore[filePath]);

        scriptContent = scriptContent + buildResultText;
      }

      /**
       * Inject style using DOM.
       */
      if (cssResultStore[filePath] !== undefined) {
        const cssText = cssResultStore[filePath].toString();
        scriptContent =
          scriptContent +
          [
            "const styleElement = document.createElement('style')",
            `styleElement.innerHTML = \`${cssText}\`;`,
            'document.head.appendChild(styleElement)',
          ].join('\n');
      }

      // End if.
      scriptContent = scriptContent + '}\n\n';
    });

    return scriptContent;
  }

  /**
   * Marge userscript header, content script code and css inject code and output it.
   * @param matchMap
   */
  private outputFile(matchMap: Record<string, string[]>) {
    const contentScriptcode = this.generateContentScriptcode(
      matchMap,
      this.buildResultStore,
      this.cssResultStore,
    );

    const headerCode = this.headerFactory.create();

    const content = [headerCode, contentScriptcode].join('\n');

    if (this.config.userscriptOutput !== undefined) {
      fse.outputFile(path.join(this.config.userscriptOutput), content);
    }
  }

  /**
   * Load content of css file selected by manifest.json and store it Buffer to this.cssResultStore.
   * @param cssFilePaths
   */
  private loadContentCssFiles(cssFilePaths: string[]) {
    cssFilePaths.forEach((cssFilePath, index) => {
      const fileName = path.basename(cssFilePath);
      const split = fileName.split('.');
      split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);

      const result = fse.readFileSync(cssFilePath);
      this.cssResultStore[cssFilePath] = result;
    });
  }
}
