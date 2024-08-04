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
import { resolveFilePath } from 'src/node/file';
import { WatchImplements } from './Watch';
import { WatchOtherResources } from './WatchOtherResource';

async function setupWatch(config: CrxMonkeyConfig, reloadServer: ReloadServer) {
  const manifest = await getManifest(config);

  await cleanupDist();

  const watchers: WatchImplements[] = [];

  if (config.devServer !== undefined) {
    const manifestFactory = new ManifestFactory(manifest);
    const headerFactory = new UserscriptHeaderFactory();

    const userscript = new WatchUserScript(manifest, manifestFactory, headerFactory, reloadServer);
    await userscript.watch();
    watchers.push(userscript);

    const contentscript = new WatchContentScripts(manifest, manifestFactory, reloadServer);
    await contentscript.watch();
    watchers.push(contentscript);

    const sw = new WatchServiceWorker(manifest, manifestFactory, reloadServer);
    await sw.watch();
    watchers.push(sw);

    const popup = new WatchPopup(manifest, manifestFactory, reloadServer);
    await popup.watch();
    watchers.push(popup);

    const other = new WatchOtherResources(
      manifest,
      manifestFactory,
      reloadServer,
      watchers,
      setupWatch,
    );
    await other.watch();
    watchers.push(other);

    createDevExtension(manifestFactory);
    createDevUserscript(headerFactory, userscript.bindGMHash);
    copyLocales();
    copyPublic();

    /**
     * write manifest json
     */
    fse.outputFile(
      path.join(config.chromeOutputDir!, 'manifest.json'),
      JSON.stringify(manifestFactory.getResult(), undefined, 2),
    );
  }
}

export default async function handleDev() {
  const config = getConfig();
  const hostingServer = new ScriptHostingServer(config.devServer.host, config.devServer.port);
  const reloadServer = new ReloadServer(config.devServer.host, config.devServer.websocket);

  await setupWatch(config, reloadServer);

  await hostingServer.start();

  consola.box(
    [
      `${chalk.cyan.bold('CRX MONKEY')} ${chalk.green(`v${pkg.version}`)}`,
      '',
      `💻 You can install the development chrome extension by loading the ${chalk.cyan.bold(config.chromeOutputDir)} directory to chrome.`,
      '',
      `💻 Open and install development userscript : ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.port}/dev.user.js`)}`,
      ` 🔄️ File hosting server running: ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.port}`)}`,
      ` 🔄️ Websocket server running: ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.websocket}`)}`,
      '',
      `📝 Documentation is here: ${chalk.blueBright('https://yakisova41.github.io/crx-monkey/docs/intro')}`,
    ].join('\n'),
  );
}
