import { getConfig } from 'src/node/config';
import { ScriptHostingServer } from './server/scriptHostingServer';
import path from 'path';
import fse from 'fs-extra';
import { createDevExtension } from './create-client/create-dev-extension';
import { ReloadServer } from './server/reloadServer';
import { ManifestFactory } from 'src/node/manifest-factory';
import { cleanupDist, copyLocales, copyPublic, getManifest } from '../utils';
import pkg from '../../../../package.json';
import { consola } from 'consola';
import chalk from 'chalk';
import { createDevUserscript } from './create-client/create-dev-userscript';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { WatchUserScript } from './WatchUserScript';
import { WatchContentScripts } from './WatchContentScripts';
import { WatchServiceWorker } from './WatchServiceWorker';
import { WatchPopup } from './WatchPopup';
import { CrxMonkeyConfig, CrxMonkeyManifest } from 'src/node/types';
import { WatchOtherResources } from './WatchOtherResource';
import { WatchImplements } from './Watch';

export class HandleDev {
  private config: CrxMonkeyConfig;
  private manifest!: CrxMonkeyManifest;
  private isInitialized: boolean = false;
  private hostingServer!: ScriptHostingServer;
  private reloadServer!: ReloadServer;
  private manifestFactory!: ManifestFactory;

  private watchers: WatchImplements[] = [];

  constructor() {
    this.config = getConfig();
  }

  public async startServer() {
    this.hostingServer = new ScriptHostingServer(
      this.config.devServer.host,
      this.config.devServer.port,
    );

    this.reloadServer = new ReloadServer(
      this.config.devServer.host,
      this.config.devServer.websocket,
    );
  }

  public async initialize() {
    await cleanupDist();

    this.manifest = await getManifest(this.config);
    this.isInitialized = true;
  }

  private async setup() {
    if (this.config.devServer !== undefined && this.isInitialized) {
      this.manifestFactory = new ManifestFactory(this.manifest);
      const headerFactory = new UserscriptHeaderFactory();

      const userscript = new WatchUserScript(
        this.manifest,
        this.manifestFactory,
        headerFactory,
        this.reloadServer,
      );
      await userscript.watch();

      const contentscript = new WatchContentScripts(
        this.manifest,
        this.manifestFactory,
        this.reloadServer,
      );
      this.watchers.push(contentscript);

      const sw = new WatchServiceWorker(this.manifest, this.manifestFactory, this.reloadServer);
      this.watchers.push(sw);

      const popup = new WatchPopup(this.manifest, this.manifestFactory, this.reloadServer);
      this.watchers.push(popup);

      const otherResources = new WatchOtherResources(
        this.manifest,
        this.manifestFactory,
        this.reloadServer,
        this,
      );
      this.watchers.push(otherResources);

      createDevExtension(this.manifestFactory);
      createDevUserscript(headerFactory, userscript.bindGMHash);
      copyLocales();
      copyPublic();

      /**
       * write manifest json
       */
      fse.outputFile(
        path.join(this.config.chromeOutputDir!, 'manifest.json'),
        JSON.stringify(this.manifestFactory.getResult(), undefined, 2),
      );
    }
  }

  public async startWatch() {
    await this.setup();

    this.watchers.forEach((watcher) => {
      watcher.watch();
    });

    await this.hostingServer.start();

    consola.box(
      [
        `${chalk.cyan.bold('CRX MONKEY')} ${chalk.green(`v${pkg.version}`)}`,
        '',
        `💻 You can install the development chrome extension by loading the ${chalk.cyan.bold(this.config.chromeOutputDir)} directory to chrome.`,
        '',
        `💻 Open and install development userscript : ${chalk.blueBright(`http://${this.config.devServer.host}:${this.config.devServer.port}/dev.user.js`)}`,
        ` 🔄️ File hosting server running: ${chalk.blueBright(`http://${this.config.devServer.host}:${this.config.devServer.port}`)}`,
        ` 🔄️ Websocket server running: ${chalk.blueBright(`http://${this.config.devServer.host}:${this.config.devServer.websocket}`)}`,
        '',
        `📝 Documentation is here: ${chalk.blueBright('https://yakisova41.github.io/crx-monkey/docs/intro')}`,
      ].join('\n'),
    );
  }

  public async stopWatch() {
    Promise.all([
      this.watchers.map(async (watcher) => {
        await watcher.dispose();
      }),
    ]);

    await this.hostingServer.dispose();
    this.reloadServer.dispose();
  }

  public async reload() {
    await Promise.all([
      this.watchers.map(async (watcher) => {
        await watcher.dispose();
      }),
    ]);

    this.watchers = [];

    await this.initialize();
    await this.setup();

    await Promise.all([
      this.watchers.map(async (watcher) => {
        await watcher.watch();
      }),
    ]);
  }
}

export default async function handleDev() {
  const dev = new HandleDev();
  dev.initialize().then(async () => {
    await dev.startServer();
    await dev.startWatch();
  });
}
