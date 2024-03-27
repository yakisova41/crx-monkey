import { BuildOptions, BuildResult, Plugin, build, context } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import manifestPlugin from 'esbuild-plugin-manifest';
import path from 'path';
import { ReloadServer } from '../server/reloadServer';
import fs from 'fs';
import consola from 'consola';

/**
 * Build chrome extension serviceworker
 * @param manifest
 * @param factory
 */
export async function watchSW(
  manifest: chrome.runtime.ManifestV3,
  factory: ManifestFactory,
  reloadServer: ReloadServer,
) {
  const sw = manifest.background?.service_worker;

  if (sw !== undefined) {
    await watchSwFile(sw, factory, (result, filePath) => {
      reloadServer.reload('RELOAD_SW');

      consola.info(`Service worker updated. | ${filePath}`);
    });
  }
}

/**
 * Build Service worker
 * @param jsFiles
 * @param factory
 */
async function watchSwFile(
  jspath: string,
  factory: ManifestFactory,
  onBuild: (result: BuildResult, jspath: string) => void,
) {
  const config = getConfig();

  const options: BuildOptions = {
    entryPoints: [jspath],
    outdir: config.chromeOutputDir,
    logLevel: 'warning',
    plugins: [
      ...(config.esBuildOptions?.plugins !== undefined
        ? config.esBuildOptions?.plugins
        : []),
      devSwPlugin,
    ],
    metafile: true,
    ...config.esBuildOptions,
  };

  const watchOptions: BuildOptions = {
    ...options,
    plugins: [
      ...(options?.plugins !== undefined ? options?.plugins : []),

      {
        name: 'onend',
        setup: (build) => {
          build.onEnd((result) => {
            onBuild(result, jspath);
          });
        },
      },
    ],
  };

  await build(options).then((res) => {
    const meta = res.metafile;
    if (meta !== undefined) {
      const outputPathes = Object.keys(meta.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));
      factory.resolveSw(outputFile);
    }
  });

  const ctx = await context(watchOptions);
  await ctx.watch();
}

const devSwPlugin: Plugin = {
  name: 'dev-sw-plugin',
  setup: (build) => {
    const { devServer } = getConfig();
    if (devServer === undefined) {
      throw new Error('');
    }

    build.onEnd((res) => {
      const meta = res.metafile;
      if (meta !== undefined) {
        const outputPathes = Object.keys(meta.outputs);
        const buildResult = fs.readFileSync(outputPathes[0]);

        fs.writeFileSync(
          outputPathes[0],
          [generateDevSwCode(devServer), buildResult].join('\n'),
        );
      }
    });
  },
};

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
