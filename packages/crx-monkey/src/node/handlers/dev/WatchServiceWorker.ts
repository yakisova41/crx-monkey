import { Watch, WatchImplements } from './Watch';
import { BuildContext, BuildOptions, BuildResult, Plugin } from 'esbuild';
import fse from 'fs-extra';
import path from 'path';
import consola from 'consola';
import { CrxMonkeyConfig } from 'src/node/types';
import { loadStaticFile } from 'src/node/static/main';

export class WatchServiceWorker extends Watch implements WatchImplements {
  private jsWatchCtxs: Record<string, BuildContext<BuildOptions>> | null = null;
  private isWatched = false;

  public async dispose() {
    if (this.jsWatchCtxs === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    const jsWatchCtxs = this.jsWatchCtxs;

    /**
     * Dispose contexts of watch js.
     */
    await Promise.all(
      Object.keys(jsWatchCtxs).map(async (jsWatchCtxKey) => {
        const jsWatchCtx = jsWatchCtxs[jsWatchCtxKey];
        await jsWatchCtx.dispose();
      }),
    );
  }

  public async watch(): Promise<void> {
    const serviceWorkerJsFile = this.manifest.background?.service_worker;

    if (serviceWorkerJsFile !== undefined) {
      this.jsWatchCtxs = await this.watchByJsFilePaths(
        [serviceWorkerJsFile],
        (...args) => {
          this.watchJsOnBuild(...args);
        },
        {},
        (result) => {
          this.watchJsOnFirstBuild(result);
        },
        [devServiceWorkerPlugin(this.config)],
      );
    } else {
      this.createDevSw();
    }
  }

  /**
   * If sw is not set in manifest, create sw for development.
   */
  private createDevSw() {
    const { devServer, chromeOutputDir } = this.config;
    this.manifestFactory.resolveSw('sw.js');
    fse.writeFileSync(path.join(chromeOutputDir, 'sw.js'), generateDevSwCode(devServer));
  }

  private watchJsOnBuild(result: BuildResult<BuildOptions>, jsFilePath: string) {
    this.reloadServer.reload('RELOAD_SW');

    if (!this.isWatched) {
      this.isWatched = true;
    } else {
      consola.info(`Service worker updated. | ${jsFilePath}`);
    }
  }

  private watchJsOnFirstBuild(result: BuildResult<BuildOptions>) {
    const { metafile } = result;
    if (metafile !== undefined) {
      const outputPathes = Object.keys(metafile.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));

      this.manifestFactory.resolveSw(outputFile);
    }
  }
}

/**
 * Plugin outputing code that marge service worker code and build result.
 * @param config
 * @returns
 */
function devServiceWorkerPlugin(config: CrxMonkeyConfig) {
  const devSwPlugin: Plugin = {
    name: 'dev-sw-plugin',
    setup: (build) => {
      const { devServer } = config;

      build.onEnd((res) => {
        const meta = res.metafile;
        if (meta !== undefined) {
          const outputPathes = Object.keys(meta.outputs);
          const buildResult = fse.readFileSync(outputPathes[0]);

          fse.writeFileSync(
            outputPathes[0],
            [generateDevSwCode(devServer), buildResult].join('\n'),
          );
        }
      });
    },
  };
  return devSwPlugin;
}

/**
 * Get static service worker code.
 * @param param0
 * @returns
 */
function generateDevSwCode({ host, websocket }: { port: number; host: string; websocket: number }) {
  const code = loadStaticFile(path.join(import.meta.dirname, './static/swDev.js'), {
    host,
    websocket: String(websocket),
  });

  return code;
}
