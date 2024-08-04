import { BuildContext, BuildOptions, BuildResult } from 'esbuild';
import { Watch, WatchImplements } from './Watch';
import fse from 'fs-extra';
import path from 'path';
import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import consola from 'consola';
import { CrxMonkeyContentScripts, CrxMonkeyManifest } from 'src/node/types';
import { loadStaticFile } from 'src/node/static/main';
import { ReloadServer } from './server/reloadServer';
import { ManifestFactory } from 'src/node/manifest-factory';
import { defineCrxContentBuildIdPlugin } from '../utils';
import { FSWatcher } from 'chokidar';

export class WatchContentScripts extends Watch implements WatchImplements {
  private readonly crxContentBuildId: string;

  private jsWatchCtxs: Record<string, BuildContext<BuildOptions>> | null = null;
  private fileWatchCtx: FSWatcher | null = null;
  private isWatched = false;

  constructor(
    manifest: CrxMonkeyManifest,
    manifestFactory: ManifestFactory,
    reloadServer: ReloadServer,
  ) {
    super(manifest, manifestFactory, reloadServer);

    this.crxContentBuildId = crypto.randomUUID();
  }

  public async dispose() {
    if (this.jsWatchCtxs === null || this.fileWatchCtx === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    const jsWatchCtxs = this.jsWatchCtxs;

    /**
     * Dispose contexts of watch js.
     */
    await Promise.all(
      Object.keys(jsWatchCtxs).map(async (jsWatchCtxKey) => {
        const jsWatchCtx = jsWatchCtxs[jsWatchCtxKey];

        await jsWatchCtx.cancel();
        await jsWatchCtx.dispose();
      }),
    );

    this.fileWatchCtx.close();
  }

  public async watch(): Promise<void> {
    const contentScripts = this.manifest.content_scripts;

    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

      this.copyCssFiles(cssFiles);

      this.jsWatchCtxs = await this.watchByJsFilePaths(
        jsFiles,
        (...args) => {
          this.watchJsOnBuild(...args);
        },
        {},
        this.watchJsOnFirstBuild.bind(this),
        [defineCrxContentBuildIdPlugin(this.crxContentBuildId)],
      );

      this.fileWatchCtx = this.watchFiles(cssFiles, (cssPath) => {
        this.reloadServer.reload('RELOAD_CSS');

        consola.info(`CSS updated. | ${cssPath}`);

        this.copyCssFiles(cssFiles);
      });

      this.setupIsolateConnector(contentScripts);
    }
  }

  private watchJsOnBuild(result: BuildResult, filePath: string) {
    if (!this.isWatched) {
      this.isWatched = true;
    } else {
      this.reloadServer.reload('RELOAD_CONTENT_SCRIPT');
      consola.info(`Content script updated. | ${filePath}`);
    }
  }

  private watchJsOnFirstBuild(result: BuildResult, filePath: string) {
    const { metafile } = result;
    if (metafile !== undefined) {
      const outputPathes = Object.keys(metafile.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));

      this.manifestFactory.resolveContentScript('js', filePath, outputFile);
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
