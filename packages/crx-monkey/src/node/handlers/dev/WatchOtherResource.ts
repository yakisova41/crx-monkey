import { CrxMonkeyManifest } from 'src/node/types';
import { Watch, WatchImplements } from './Watch';
import { ManifestFactory } from 'src/node/manifest-factory';
import { ReloadServer } from './server/reloadServer';
import fse from 'fs-extra';
import path from 'path';
import consola from 'consola';
import { FSWatcher } from 'chokidar';
import { HandleDev } from '.';

export class WatchOtherResources extends Watch implements WatchImplements {
  private fileWatchCtx: FSWatcher | null = null;
  private readonly handleDev: HandleDev;

  constructor(
    manifest: CrxMonkeyManifest,
    manifestFactory: ManifestFactory,
    reloadServer: ReloadServer,
    handleDev: HandleDev,
  ) {
    super(manifest, manifestFactory, reloadServer);
    this.handleDev = handleDev;
  }

  public async watch() {
    const targets = [this.config.manifestPath];

    this.fileWatchCtx = this.watchFiles([...targets], (filePath) => {
      if (filePath === this.config.manifestPath) {
        // Manifest changed
        this.handleDev.reload();

        consola.success(`Manifest updated. | ${filePath}`);
      }
    });
  }

  public async dispose() {
    if (this.fileWatchCtx === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    this.fileWatchCtx.close();
  }
}
