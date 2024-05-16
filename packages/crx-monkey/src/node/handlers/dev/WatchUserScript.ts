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
import prettier from 'prettier';
import { UsersScript } from '../UserScript';
import consola from 'consola';
import { CrxMonkeyManifest } from 'src/node/types';

export class WatchUserScript extends Watch implements WatchImplements {
  private readonly headerFactory: UserscriptHeaderFactory;
  private buildResultStore: Record<string, Uint8Array> = {};
  private cssResultStore: Record<string, Buffer> = {};
  public readonly bindGMHash: string;

  constructor(
    manifest: CrxMonkeyManifest,
    manifestFactory: ManifestFactory,
    headerFactory: UserscriptHeaderFactory,
    reloadServer: ReloadServer,
  ) {
    super(manifest, manifestFactory, reloadServer);

    this.headerFactory = headerFactory;
    this.reloadServer;
    this.bindGMHash = UsersScript.convertFilePathToFuncName(crypto.randomUUID());
  }

  public async watch() {
    const contentScripts = this.manifest.content_scripts;
    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      const { allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

      await this.headerRegister(allMatches);

      this.loadContentCssFiles(cssFiles);

      await this.watchByJsFilePaths(
        jsFiles,
        (...args) => {
          this.watchJsOnBuild(...args);
          this.outputFile();
        },
        { write: false },
        () => {},
      );

      this.watchFiles(cssFiles, () => {
        this.loadContentCssFiles(cssFiles);
        this.outputFile();
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
     * If included all_urls in matches of manifest, do not have to.
     */
    if (!allMatches.includes('<all_urls>')) {
      allMatches.forEach((match) => {
        this.headerFactory.push('@match', match);
      });
    }

    /**
     * Set version designation by manifest to header.
     */
    this.headerFactory.push('@version', this.manifest.version);

    if (this.manifest.run_at !== undefined) {
      this.headerFactory.push('@run-at', convertChromeRunAtToUserJsRunAt(this.manifest.run_at));
    } else {
      this.headerFactory.push('@run-at', 'document-start');
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
    if (this.config.importIconToUserscript) {
      const icons = this.manifest.icons;

      if (icons !== undefined) {
        const icon48 = icons['48'];
        if (icon48 !== undefined) {
          const iconPath = path.join(path.dirname(this.config.manifestPath!), icon48);
          const base64 = convertImgToBase64(iconPath);
          this.headerFactory.push('@icon', base64);
        } else {
          throw consola.error(new Error('No size 48 icons were found in the icons item'));
        }
      } else {
        throw consola.error(
          new Error(
            'No "icons" entry found in manifest. Disable the "importIconToUserscript" entry in the config file or add an "icons" entry to manifest.',
          ),
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
   * Generate code contain functions for the build result of each file.
   */
  private generateBuildResultFuncCode(jsBuildResultStore: Record<string, Uint8Array>) {
    let scriptContent = '';

    Object.keys(jsBuildResultStore).forEach((filePath) => {
      const content = jsBuildResultStore[filePath];

      scriptContent =
        scriptContent +
        [
          '',
          `// ${filePath}`,
          `function ${UsersScript.convertFilePathToFuncName(filePath)}(GM) {`,
        ].join('\n');

      const buildResultText = new TextDecoder().decode(content);

      scriptContent = scriptContent + buildResultText;

      scriptContent = scriptContent + '}\n\n';
    });

    return scriptContent;
  }

  /**
   * Generate code contain functions for the css load result of each file.
   */
  private generateCssInjectFuncCode(cssResultStore: Record<string, Buffer>) {
    let scriptContent = '';

    Object.keys(cssResultStore).forEach((filePath) => {
      const content = cssResultStore[filePath];

      scriptContent =
        scriptContent +
        [
          '',
          `// ${filePath}`,
          `function ${UsersScript.convertFilePathToFuncName(filePath)}() {`,
        ].join('\n');

      const cssText = content.toString();
      scriptContent =
        scriptContent +
        [
          "const styleElement = document.createElement('style')",
          `styleElement.innerHTML = \`${cssText}\`;`,
          'document.head.appendChild(styleElement)',
        ].join('\n');

      scriptContent = scriptContent + '}\n\n';
    });

    return scriptContent;
  }

  /**
   * Build content scripts for each match and generate code to restrict execution for each match using if
   * @param matchMap
   * @param jsBuildResultStore
   * @param cssResultStore
   * @returns
   */
  private generateContentScriptcode(
    jsBuildResultStore: Record<string, Uint8Array>,
    cssResultStore: Record<string, Buffer>,
  ) {
    // script result tmp.
    let scriptContent = '';

    scriptContent = scriptContent + this.generateBuildResultFuncCode(jsBuildResultStore);

    scriptContent = scriptContent + this.generateCssInjectFuncCode(cssResultStore);

    /**
     * Run functions created for each item in the content script.
     */
    const contentScripts = this.manifest.content_scripts;

    if (contentScripts !== undefined) {
      contentScripts.forEach((contentScript) => {
        const { matches, js, css, exclude_matches, bind_GM_api } = contentScript;

        if (matches !== undefined && !matches.includes('<all_urls>')) {
          // Start conditional statement of if for branch of href.
          scriptContent =
            scriptContent +
            UsersScript.genarateCodeOfStartIfStatementByMatches(matches, exclude_matches);
        }

        // run_at is always document_start when dev mode.
        scriptContent =
          scriptContent +
          UsersScript.generateCodeIncludingInjectTiming(
            'document_start',
            js,
            css,
            false,
            false,
            bind_GM_api === true ? this.bindGMHash : false,
          );

        // End if.
        if (matches !== undefined && !matches.includes('<all_urls>')) {
          scriptContent = scriptContent + '}\n\n';
        }

        scriptContent = scriptContent + '\n\n';
      });
    }

    return scriptContent;
  }

  /**
   * Marge userscript header, content script code and css inject code and output it.
   * @param matchMap
   */
  private async outputFile() {
    const contentScriptcode = this.generateContentScriptcode(
      this.buildResultStore,
      this.cssResultStore,
    );

    const headerCode = this.headerFactory.create();

    const content = [headerCode, contentScriptcode].join('\n');

    const { format, options } = this.config.prettier;

    if (this.config.userscriptOutput !== undefined) {
      if (format) {
        if (options === undefined) {
          throw consola.error(new Error('Prettier options in crx-monkey.config.js is Undefined.'));
        }

        const formated = await prettier.format(content, options);
        fse.outputFile(path.join(this.config.userscriptOutput), formated);
      } else {
        fse.outputFile(path.join(this.config.userscriptOutput), content);
      }
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
