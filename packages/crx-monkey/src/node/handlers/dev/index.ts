import { getConfig } from 'src/node/config';
import { ScriptHostingServer } from './server/scriptHostingServer';
import path from 'path';
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

  if (!fse.existsSync(config.manifestPath)) {
    throw consola.error(
      new Error(
        `The manifest file ${config.manifestPath} does not exist. If you using json? set "manifestPath" to "crx-monkey.config.js"`,
      ),
    );
  }

  const manifestExt = config.manifestPath.split('.').pop();

  let manifest: CrxMonkeyManifest;

  if (manifestExt === 'json') {
    const data = fse.readFileSync(config.manifestPath);
    manifest = JSON.parse(data.toString());
  } else if (manifestExt === 'js') {
    manifest = (await import(config.manifestPath)).default;
  } else {
    throw consola.error(new Error('Only js and json manifests can be loaded.'));
  }

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
