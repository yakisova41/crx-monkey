import { getConfig } from 'src/node/config';
import { ScriptHostingServer } from './server/scriptHostingServer';
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { createDevExtension } from './create-client/create-dev-extension';
import { ReloadServer } from './server/reloadServer';
import { ManifestFactory } from 'src/node/manifest-factory';
import { copyLocales, copyPublic } from '../utils';
import pkg from '../../../../package.json';
import { consola } from 'consola';
import chalk from 'chalk';
import { createDevUserscript } from './create-client/create-dev-userscript';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { WatchUserScript } from './WatchUserScript';
import { WatchContentScripts } from './WatchContentScripts';
import { WatchServiceWorker } from './WatchServiceWorker';
import { WatchPopup } from './WatchPopup';
import { CrxMonkeyManifest } from 'src/node/types';

export default async function handleDev() {
  const config = getConfig();

  const data = fs.readFileSync(config.manifestJsonPath!);
  const manifest: CrxMonkeyManifest = JSON.parse(data.toString());

  if (config.devServer !== undefined) {
    const hostingServer = new ScriptHostingServer(config.devServer.host, config.devServer.port);

    const reloadServer = new ReloadServer(config.devServer.host, config.devServer.websocket);

    const manifestFactory = new ManifestFactory(manifest);
    const headerFactory = new UserscriptHeaderFactory();

    const userscript = new WatchUserScript(manifest, manifestFactory, headerFactory, reloadServer);
    await userscript.watch();

    const contentscript = new WatchContentScripts(manifest, manifestFactory, reloadServer);
    await contentscript.watch();

    const sw = new WatchServiceWorker(manifest, manifestFactory, reloadServer);
    await sw.watch();

    const popup = new WatchPopup(manifest, manifestFactory, reloadServer);
    await popup.watch();

    createDevExtension(manifestFactory);
    createDevUserscript(headerFactory);
    copyLocales();
    copyPublic();

    /**
     * write manifest json
     */
    fse.outputFile(
      path.join(config.chromeOutputDir!, 'manifest.json'),
      JSON.stringify(manifestFactory.getWorkspace(), undefined, 2),
    );

    await hostingServer.start();

    consola.box(
      [
        `${chalk.cyan.bold('CRX-MONKEY')} ${chalk.green(`v${pkg.version}`)}`,
        '',
        `💻 Open and install develop userscript : ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.port}/dev.user.js`)}`,
        ` 🔄️ File hosting server running: ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.port}`)}`,
        ` 🔄️ Websocket server running: ${chalk.blueBright(`http://${config.devServer.host}:${config.devServer.websocket}`)}`,
      ].join('\n'),
    );
  }
}
