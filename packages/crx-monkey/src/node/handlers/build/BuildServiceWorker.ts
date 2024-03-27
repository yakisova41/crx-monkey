import { Build, BuildImplements } from './Build';
import path from 'path';
import manifestPlugin from 'esbuild-plugin-manifest';

export class BuildServiceWorker extends Build implements BuildImplements {
  public async build(): Promise<void> {
    const serviceWorkerJsFile = this.manifest.background?.service_worker;

    if (serviceWorkerJsFile !== undefined) {
      await this.buildByJsFilePaths(
        [serviceWorkerJsFile],
        (result) => {
          const { metafile } = result;
          if (metafile !== undefined) {
            const outputPathes = Object.keys(metafile.outputs);
            const outputFile = path.basename(path.basename(outputPathes[0]));

            this.manifestFactory.resolveSw(outputFile);
          }
        },
        { logLevel: 'info' },
        [manifestPlugin()],
      );
    }
  }
}
