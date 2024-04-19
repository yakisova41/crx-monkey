import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import { Build, BuildImplements } from './Build';
import path from 'path';
import fse from 'fs-extra';
import manifestPlugin from 'esbuild-plugin-manifest';

export class BuildContentScript extends Build implements BuildImplements {
  public async build(): Promise<void> {
    const contentScripts = this.manifest.content_scripts;

    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      this.copyCssFiles(cssFiles);

      await this.buildByJsFilePaths(
        jsFiles,
        (result, jsFilePath) => {
          const { metafile } = result;
          if (metafile !== undefined) {
            const outputPathes = Object.keys(metafile.outputs);
            const outputFile = path.basename(path.basename(outputPathes[0]));

            this.manifestFactory.resolveContentScript('js', jsFilePath, outputFile);
          }
        },
        { logLevel: 'info' },
        [manifestPlugin()],
      );
    }
  }

  /**
   * Copy css files to dist.
   * @param cssFilePaths
   */
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
