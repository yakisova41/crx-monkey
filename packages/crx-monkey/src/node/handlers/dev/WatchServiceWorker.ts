import { Watch, WatchImplements } from './Watch';
import { BuildOptions, BuildResult, Plugin } from 'esbuild';
import fse from 'fs-extra';
import path from 'path';
import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import consola from 'consola';
import { CrxMonkeyConfig } from 'src/node/types';

export class WatchServiceWorker extends Watch implements WatchImplements {
  public async watch(): Promise<void> {
    const serviceWorkerJsFile = this.manifest.background?.service_worker;

    if (serviceWorkerJsFile !== undefined) {
      await this.watchByJsFilePaths(
        [serviceWorkerJsFile],
        (...args) => {
          this.watchJsOnBuild(...args);
        },
        {},
        (...args) => {
          this.watchJsOnFirstBuild(...args);
        },
        [devServiceWorkerPlugin(this.config)],
      );
    }
  }

  private watchJsOnBuild(
    result: BuildResult<BuildOptions>,
    jsFilePath: string,
  ) {
    this.reloadServer.reload('RELOAD_SW');
    consola.info(`Service worker updated. | ${jsFilePath}`);
  }

  private watchJsOnFirstBuild(
    result: BuildResult<BuildOptions>,
    jsFilePath: string,
  ) {
    const { metafile } = result;
    if (metafile !== undefined) {
      const outputPathes = Object.keys(metafile.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));

      this.manifestFactory.resolveSw(outputFile);
    }
  }
}

function devServiceWorkerPlugin(config: CrxMonkeyConfig) {
  const devSwPlugin: Plugin = {
    name: 'dev-sw-plugin',
    setup: (build) => {
      const { devServer } = config;
      if (devServer === undefined) {
        throw new Error('');
      }

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

function generateDevSwCode({
  host,
  websocket,
}: {
  port: number;
  host: string;
  websocket: number;
}) {
  const code = `
  const websocket = new WebSocket(\`ws://${host}:${websocket}\`);

  websocket.addEventListener('message', ({ data }) => {
    switch (data) {
      case 'RELOAD_CONTENT_SCRIPT':
      case 'RELOAD_SW':
      case 'RELOAD_CSS':
        chrome.runtime.reload();
        break;

      default:
        break;
    }
  });
  `;

  return code;
}
