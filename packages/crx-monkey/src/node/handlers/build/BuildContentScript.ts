import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import { Build, BuildImplements } from './Build';
import path from 'path';
import fse from 'fs-extra';
import manifestPlugin from 'esbuild-plugin-manifest';
import { defineCrxContentBuildIdPlugin } from '../utils';
import { CrxMonkeyContentScripts, CrxMonkeyManifest } from 'src/node/types';
import { ManifestFactory } from 'src/node/manifest-factory';
import { loadStaticFile } from 'src/node/static/main';

export class BuildContentScript extends Build implements BuildImplements {
  private readonly crxContentBuildId: string;

  constructor(manifest: CrxMonkeyManifest, manifestFactory: ManifestFactory) {
    super(manifest, manifestFactory);

    this.crxContentBuildId = crypto.randomUUID();
  }

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
        [manifestPlugin(), defineCrxContentBuildIdPlugin(this.crxContentBuildId)],
      );

      this.setupIsolateConnector(contentScripts);
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

  /**
   * Connector for clients to bypass chrome runtime
   * @param contentScripts
   */
  private setupIsolateConnector(contentScripts: CrxMonkeyContentScripts) {
    const connectorFilename = 'crx-monkey-isolate-connector.js';
    const connectorPath = path.join(this.config.chromeOutputDir!, connectorFilename);

    let includeConnector = false;
    const matches: string[] = [];

    contentScripts.forEach((contentScript) => {
      if (contentScript.connection_isolated) {
        matches.push(...(contentScript.matches !== undefined ? contentScript.matches : []));
        includeConnector = true;
      }
    });

    if (includeConnector) {
      const connectorContent = loadStaticFile(
        path.join(import.meta.dirname, './static/isolateConnector.js'),
        {
          crxContentBuildId: this.crxContentBuildId,
        },
      );

      fse.outputFile(connectorPath, connectorContent);

      this.manifestFactory.addContentScript(
        [connectorFilename],
        [],
        matches,
        'ISOLATED',
        'document_start',
      );
    }
  }
}
