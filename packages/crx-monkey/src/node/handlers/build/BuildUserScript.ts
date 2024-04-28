import { ManifestFactory } from 'src/node/manifest-factory';
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
import { Build, BuildImplements } from './Build';
import { generateInjectScriptCode } from '../dev/utils';
import prettier from 'prettier';
import { UsersScript } from '../UserScript';
import consola from 'consola';

export class BuildUserScript extends Build implements BuildImplements {
  private readonly headerFactory: UserscriptHeaderFactory;
  private buildResultStore: Record<string, Uint8Array> = {};
  private cssResultStore: Record<string, Buffer> = {};

  constructor(
    manifest: chrome.runtime.ManifestV3,
    manifestFactory: ManifestFactory,
    headerFactory: UserscriptHeaderFactory,
  ) {
    super(manifest, manifestFactory);

    this.headerFactory = headerFactory;
  }

  /**
   * Build userscript
   */
  public async build() {
    if (this.config.devServer === undefined) {
      throw new Error('Dev Server is not enabled');
    }

    /**
     * Build and output content scripts.
     */
    const contentScripts = this.manifest.content_scripts;

    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      const { allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

      const isExistInjectScripts = this.isIncludedInjectScripts(jsFiles);

      await this.headerRegister(allMatches, isExistInjectScripts);

      this.loadContentCssFiles(cssFiles);

      await this.buildByJsFilePaths(
        jsFiles,
        (...args) => {
          this.buildJsOnBuild(...args);
        },
        { write: false, logLevel: 'silent' },
      );

      await this.outputFile();
    }
  }

  /**
   * Register meta data to userscript header factory.
   * @param allMatches
   * @param unsafeWindow
   */
  private async headerRegister(allMatches: string[], unsafeWindow: boolean) {
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

          // If already included unsafewindow in grant, after no need include.
          if (configHeaderItem[0] === '@grant' && configHeaderItem[1] === 'unsafeWindow') {
            unsafeWindow = false;
          }
        }
      });
    }

    if (unsafeWindow) {
      // If not already included unsafewindow, run it.
      this.headerFactory.push('@grant', 'unsafeWindow');
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

  private buildJsOnBuild(result: BuildResult, jsFilePath: string) {
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
          `function ${UsersScript.convertFilePathToFuncName(filePath)}() {`,
        ].join('\n');

      const buildResultText = new TextDecoder().decode(content);

      if (this.config.userscriptInjectPage.includes(filePath)) {
        // Inject script using DOM.
        scriptContent = scriptContent + generateInjectScriptCode(buildResultText);
      } else {
        // Run script in userscript sandbox.
        scriptContent = scriptContent + buildResultText;
      }

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
   * Build content scripts for each match and generate code to restrict execution for each match using the if syntax.
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
        const { matches, js, css, run_at, exclude_matches } = contentScript;

        // Start conditional statement of if for branch of href.
        scriptContent =
          scriptContent +
          UsersScript.genarateCodeOfStartIfStatementByMatches(matches, exclude_matches);

        scriptContent =
          scriptContent + UsersScript.generateCodeIncludingInjectTiming(run_at, js, css);

        // End if.
        if (matches !== undefined) {
          scriptContent = scriptContent + '}\n\n';
        }
      });
    }

    return scriptContent;
  }

  /**
   * Marge userscript header, content script code and css inject code and output it.
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

  /**
   * Does "userscriptInjectPage" in config contain even one js files?
   * @param jsFiles js file paths.
   * @returns
   */
  private isIncludedInjectScripts(jsFiles: string[]) {
    let result = false;

    jsFiles.forEach((jsFile) => {
      if (this.config.userscriptInjectPage.includes(jsFile)) {
        result = true;
      }
    });

    return result;
  }
}
