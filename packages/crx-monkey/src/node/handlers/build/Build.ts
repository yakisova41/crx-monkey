import { BuildOptions, BuildResult, Plugin, build } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import { CrxMonkeyConfig } from 'src/node/types';

export class Build {
  protected readonly manifest: chrome.runtime.ManifestV3;
  protected readonly manifestFactory: ManifestFactory;
  protected readonly config: CrxMonkeyConfig;

  constructor(manifest: chrome.runtime.ManifestV3, manifestFactory: ManifestFactory) {
    this.manifest = manifest;
    this.manifestFactory = manifestFactory;

    const config = getConfig();
    if (config === undefined) {
      throw new Error(['Config is undefined.'].join('\n'));
    }
    this.config = config;
  }

  protected async buildByJsFilePaths(
    jsFilePaths: string[],
    onBuild: (result: BuildResult<BuildOptions>, jsFilePath: string) => void,
    overrideOptions: BuildOptions | null = null,
    overridePlugins: Plugin[] = [],
  ) {
    await Promise.all(
      jsFilePaths.map(async (jsFilePath) => {
        const options: BuildOptions = {
          entryPoints: [jsFilePath],
          outdir: this.config.chromeOutputDir,
          logLevel: 'warning',
          metafile: true,
          plugins: [
            ...overridePlugins,
            ...(this.config.esBuildOptions?.plugins !== undefined
              ? this.config.esBuildOptions?.plugins
              : []),
          ],
          ...overrideOptions,
          ...this.config.esBuildOptions,
        };

        await build(options).then((result) => {
          onBuild(result, jsFilePath);
        });
      }),
    );
  }
}

export interface BuildImplements {
  build(): Promise<void>;
}
