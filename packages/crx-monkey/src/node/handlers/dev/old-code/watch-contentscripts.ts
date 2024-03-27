import { getConfig } from 'src/node/config';
import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import { BuildOptions, BuildResult, build, context } from 'esbuild';
import manifestPlugin from 'esbuild-plugin-manifest';
import path from 'path';
import { getDevelopDir } from '../utils';
import { ReloadServer } from '../server/reloadServer';
import chokidar from 'chokidar';
import fs from 'fs';
import { ManifestFactory } from 'src/node/manifest-factory';
import consola from 'consola';

export async function watchContentScripts(
  manifest: chrome.runtime.ManifestV3,
  factory: ManifestFactory,
  reloadServer: ReloadServer,
) {
  const contentScripts = manifest.content_scripts;

  if (contentScripts !== undefined) {
    const { jsFiles, cssFiles } =
      getAllJsAndCSSByContentScripts(contentScripts);

    await watchJsFiles(jsFiles, factory, ({ metafile }, filePath) => {
      reloadServer.reload('RELOAD_CONTENT_SCRIPT');

      consola.info(`Content script updated. | ${filePath}`);
    });

    copyCssFiles(cssFiles, factory);

    watchCssFiles(cssFiles, factory, (filePath) => {
      reloadServer.reload('RELOAD_CSS');

      consola.info(`CSS updated. | ${filePath}`);
    });
  }
}

async function watchCssFiles(
  cssFiles: string[],
  factory: ManifestFactory,
  onCopied: (path: string) => void,
) {
  const watcher = chokidar.watch(cssFiles, {});
  watcher.on('change', (path) => {
    copyCssFiles(cssFiles, factory);
    onCopied(path);
  });
}

async function watchJsFiles(
  jsFiles: string[],
  factory: ManifestFactory,
  onBuild: (result: BuildResult, filePath: string) => void,
) {
  const config = getConfig();

  await Promise.all(
    jsFiles.map(async (js) => {
      const options: BuildOptions = {
        entryPoints: [js],
        outdir: config.chromeOutputDir,
        logLevel: 'warning',
        minify: true,
        metafile: true,
        plugins: [
          ...(config.esBuildOptions?.plugins !== undefined
            ? config.esBuildOptions?.plugins
            : []),
        ],
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
                onBuild(result, js);
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

          factory.resolveContentScript('js', js, outputFile);
        }
      });

      const ctx = await context(watchOptions);
      await ctx.watch();
    }),
  );
}

function copyCssFiles(cssFiles: string[], factory: ManifestFactory) {
  const config = getConfig();

  cssFiles.forEach((css, index) => {
    const fileName = path.basename(css);
    const split = fileName.split('.');
    split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);
    const outPutFilename = split.join('.');

    fs.copyFileSync(css, path.join(config.chromeOutputDir!, outPutFilename));

    factory.resolveContentScript('css', css, outPutFilename);
  });
}
