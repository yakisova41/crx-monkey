import { BuildContext, BuildOptions, BuildResult, Plugin, build, context } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import { CrxMonkeyConfig, CrxMonkeyManifest } from 'src/node/types';
import chokidar from 'chokidar';
import { ReloadServer } from './server/reloadServer';
import consola from 'consola';

export class Watch {
  protected readonly manifest: CrxMonkeyManifest;
  protected readonly manifestFactory: ManifestFactory;
  protected readonly config: CrxMonkeyConfig;
  protected readonly reloadServer: ReloadServer;

  constructor(
    manifest: CrxMonkeyManifest,
    manifestFactory: ManifestFactory,
    reloadServer: ReloadServer,
  ) {
    this.manifest = manifest;
    this.manifestFactory = manifestFactory;
    this.reloadServer = reloadServer;

    const config = getConfig();
    if (config === undefined) {
      throw consola.error(new Error('Config is undefined.'));
    }
    this.config = config;
  }

  protected watchFiles(filePaths: string[], onChange: (filePath: string) => void) {
    const watcher = chokidar.watch(filePaths, {});
    watcher.on('change', (path) => {
      onChange(path);
    });
    return watcher;
  }

  /**
   * Watch multiple js files.
   * @param jsFilePaths
   * @param onBuild
   * @param overrideOptions
   * @param onFirstBuild
   * @param overridePlugins
   * @returns
   */
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
          minify: false,
          bundle: true,
          metafile: true,
          platform: 'browser',
          treeShaking: true,
          target: 'esnext',
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
  dispose(): Promise<void>;
}
