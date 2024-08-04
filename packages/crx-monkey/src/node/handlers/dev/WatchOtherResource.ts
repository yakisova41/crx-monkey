import { CrxMonkeyConfig, CrxMonkeyManifest } from 'src/node/types';
import { Watch, WatchImplements } from './Watch';
import { ManifestFactory } from 'src/node/manifest-factory';
import { ReloadServer } from './server/reloadServer';
import fse from 'fs-extra';
import path from 'path';
import consola from 'consola';
import { FSWatcher } from 'chokidar';

export class WatchOtherResources extends Watch implements WatchImplements {
  private fileWatchCtx: FSWatcher | null = null;
  private readonly watchers: WatchImplements[];
  private readonly setupWatchFunc: (
    config: CrxMonkeyConfig,
    reloadServer: ReloadServer,
  ) => Promise<void>;
  constructor(
    manifest: CrxMonkeyManifest,
    manifestFactory: ManifestFactory,
    reloadServer: ReloadServer,
    watchers: WatchImplements[],
    setupWatchFunc: (config: CrxMonkeyConfig, reloadServer: ReloadServer) => Promise<void>,
  ) {
    super(manifest, manifestFactory, reloadServer);
    this.watchers = watchers;
    this.setupWatchFunc = setupWatchFunc;
  }

  public async watch() {
    const targets = [this.config.manifestPath];

    this.fileWatchCtx = this.watchFiles([...targets], (filePath) => {
      if (filePath === this.config.manifestPath) {
        // Manifest changed

        consola.success(`Manifest updated. | ${filePath}`);

        this.reload().then();
      }
    });
  }

  public async dispose() {
    if (this.fileWatchCtx === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    this.fileWatchCtx.close();
  }

  private async reload() {
    await Promise.all(
      this.watchers.map(async (watcher) => {
        await watcher.dispose();
      }),
    );

    await this.setupWatchFunc(this.config, this.reloadServer);
  }
}
