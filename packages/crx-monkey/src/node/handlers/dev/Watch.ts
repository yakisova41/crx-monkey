import { BuildContext, BuildOptions, BuildResult, Plugin, build, context } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import { CrxMonkeyConfig } from 'src/node/types';
import chokidar from 'chokidar';
import { ReloadServer } from './server/reloadServer';

export class Watch {
  protected readonly manifest: chrome.runtime.ManifestV3;
  protected readonly manifestFactory: ManifestFactory;
  protected readonly config: CrxMonkeyConfig;
  protected readonly reloadServer: ReloadServer;

  constructor(
    manifest: chrome.runtime.ManifestV3,
    manifestFactory: ManifestFactory,
    reloadServer: ReloadServer,
  ) {
    this.manifest = manifest;
    this.manifestFactory = manifestFactory;
    this.reloadServer = reloadServer;

    const config = getConfig();
    if (config === undefined) {
      throw new Error(['Config is undefined.'].join('\n'));
    }
    this.config = config;
  }

  protected watchByCssPaths(cssFilePaths: string[], onChaged: (cssFilePath: string) => void) {
    const watcher = chokidar.watch(cssFilePaths, {});
    watcher.on('change', (path) => {
      onChaged(path);
    });
  }

  protected async watchByJsFilePaths(
    jsFilePaths: string[],
    onBuild: (result: BuildResult<BuildOptions>, jsFilePath: string) => void,
    overrideOptions: BuildOptions | null = null,
    onFirstBuild: (result: BuildResult<BuildOptions>, jsFilePath: string) => void,
    overridePlugins: Plugin[] = [],
  ) {
    const contexts: Record<string, BuildContext<BuildOptions>> = {};

    await Promise.all(
      jsFilePaths.map(async (jsFilePath) => {
        const options: BuildOptions = {
          entryPoints: [jsFilePath],
          outdir: this.config.chromeOutputDir,
          logLevel: 'warning',
          minify: true,
          metafile: true,
          plugins: [
            ...overridePlugins,
            ...(this.config.esBuildOptions.plugins !== undefined
              ? this.config.esBuildOptions.plugins
              : []),
          ],
          ...overrideOptions,
          ...this.config.esBuildOptions,
        };

        const watchOptions: BuildOptions = {
          ...options,
          plugins: [
            ...(options?.plugins !== undefined ? options.plugins : []),
            {
              name: 'watch-build-end',
              setup: (build) => {
                build.onEnd((result) => {
                  onBuild(result, jsFilePath);
                });
              },
            },
          ],
        };

        await build(options).then((result) => {
          onFirstBuild(result, jsFilePath);
        });

        const ctx = await context(watchOptions);
        await ctx.watch();
        contexts[jsFilePath] = ctx;
      }),
    );

    return contexts;
  }
}

export interface WatchImplements {
  watch(): Promise<void>;
}
