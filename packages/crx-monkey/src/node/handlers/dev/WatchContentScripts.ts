import { BuildResult } from 'esbuild';
import { Watch, WatchImplements } from './Watch';
import fse from 'fs-extra';
import path from 'path';
import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import consola from 'consola';

export class WatchContentScripts extends Watch implements WatchImplements {
  public async watch(): Promise<void> {
    const contentScripts = this.manifest.content_scripts;

    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      this.copyCssFiles(cssFiles);

      await this.watchByJsFilePaths(
        jsFiles,
        (...args) => {
          this.watchJsOnBuild(...args);
        },
        {},
        this.watchJsOnFirstBuild.bind(this),
      );

      this.watchByCssPaths(cssFiles, (cssPath) => {
        this.reloadServer.reload('RELOAD_CSS');

        consola.info(`CSS updated. | ${cssPath}`);

        this.copyCssFiles(cssFiles);
      });
    }
  }

  private watchJsOnBuild(result: BuildResult, filePath: string) {
    this.reloadServer.reload('RELOAD_CONTENT_SCRIPT');
    consola.info(`Content script updated. | ${filePath}`);
  }

  private watchJsOnFirstBuild(result: BuildResult, filePath: string) {
    const { metafile } = result;
    if (metafile !== undefined) {
      const outputPathes = Object.keys(metafile.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));

      this.manifestFactory.resolveContentScript('js', filePath, outputFile);
    }
  }

  private copyCssFiles(cssFilePaths: string[]) {
    cssFilePaths.forEach((cssFilePath, index) => {
      const fileName = path.basename(cssFilePath);
      const split = fileName.split('.');
      split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);
      const outPutFilename = split.join('.');

      fse.copy(cssFilePath, path.join(this.config.chromeOutputDir!, outPutFilename));

      this.manifestFactory.resolveContentScript('css', cssFilePath, outPutFilename);
    });
  }
}
