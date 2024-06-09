import { getConfig } from 'src/node/config';
import path from 'path';
import fse from 'fs-extra';
import { ManifestFactory } from 'src/node/manifest-factory';
import { cleanupDist, copyLocales, copyPublic } from '../utils';
import { BuildContentScript } from './BuildContentScript';
import { BuildServiceWorker } from './BuildServiceWorker';
import { BuildUserScript } from './BuildUserScript';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { BuildPopup } from './BuildPopup';
import { CrxMonkeyManifest } from 'src/node/types';
import consola from 'consola';
import { resolveFilePath } from 'src/node/file';

export default async function handlebuild() {
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
    manifest = (await import(resolveFilePath(config.manifestPath))).default;
  } else {
    throw consola.error(new Error('Only js and json manifests can be loaded.'));
  }

  await cleanupDist();

  const manifestFactory = new ManifestFactory(manifest);
  const headerFactory = new UserscriptHeaderFactory();

  const contentScripts = new BuildContentScript(manifest, manifestFactory);
  await contentScripts.build();

  const sw = new BuildServiceWorker(manifest, manifestFactory);
  await sw.build();

  const popup = new BuildPopup(manifest, manifestFactory);
  await popup.build();

  const userscript = new BuildUserScript(manifest, manifestFactory, headerFactory);
  await userscript.build();

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
