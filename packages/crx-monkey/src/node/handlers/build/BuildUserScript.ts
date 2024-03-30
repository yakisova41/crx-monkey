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

  public async build() {
    if (this.config.devServer === undefined) {
      throw new Error('Dev Server is not enabled');
    }

    const contentScripts = this.manifest.content_scripts;
    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      /**
       * If even one css is loaded, a GM_addStyle grant is added to the header
       */
      const isLoadedCss = cssFiles.length !== 0;

      const { matchMap, allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

      this.headerRegister(allMatches, isLoadedCss);

      this.loadContentCssFiles(cssFiles);

      await this.buildByJsFilePaths(
        jsFiles,
        (...args) => {
          this.buildJsOnBuild(...args);
          this.outputFile(matchMap);
        },
        { write: false, logLevel: 'silent' },
      );

      this.outputFile(matchMap);
    }
  }

  private async headerRegister(allMatches: string[], isLoadedCss: boolean) {
    allMatches.forEach((match) => {
      this.headerFactory.push('@match', match);
    });

    this.headerFactory.push('@version', this.manifest.version);

    if (this.manifest.run_at !== undefined) {
      this.headerFactory.push('@run-at', convertChromeRunAtToUserJsRunAt(this.manifest.run_at));
    }

    const names = await geti18nMessages(this.manifest.name);
    Object.keys(names).forEach((lang) => {
      if (lang === 'en') {
        this.headerFactory.push('@name', names[lang]);
      } else {
        this.headerFactory.push(`@name:${lang}`, names[lang]);
      }
    });

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

    if (isLoadedCss) {
      this.headerFactory.push('@grant', 'GM_addStyle');
    }

    const configHeader = this.config.userScriptHeader;
    if (configHeader !== undefined) {
      configHeader.forEach((configHeaderItem) => {
        if (this.headerFactory.exist(configHeaderItem[0]) && configHeaderItem[0] !== '@grant') {
          this.headerFactory.replace(configHeaderItem[0], configHeaderItem[1]);
        } else {
          this.headerFactory.push(configHeaderItem[0], configHeaderItem[1]);
        }
      });
    }

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
    let scriptContent = '';
    Object.keys(matchMap).forEach((filePath) => {
      const matches = matchMap[filePath];

      scriptContent = scriptContent + 'if (';

      let isOr = false;
      matches.forEach((matchPattern) => {
        scriptContent =
          scriptContent + `${isOr ? ' ||' : ''}location.href.match('${matchPattern}') !== null`;

        isOr = true;
      });

      scriptContent = scriptContent + ') {\n';

      if (jsBuildResultStore[filePath] !== undefined) {
        const buildResultText = new TextDecoder().decode(jsBuildResultStore[filePath]);
        scriptContent = scriptContent + buildResultText;
      }

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

      scriptContent = scriptContent + '}\n\n';
    });

    return scriptContent;
  }

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
