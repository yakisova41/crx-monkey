import { getConfig } from 'src/node/config';
import path from 'path';
import fs from 'fs';
import { ManifestFactory } from 'src/node/manifest-factory';
import { copyLocales, copyPublic } from '../utils';
import { BuildContentScript } from './BuildContentScript';
import { BuildServiceWorker } from './BuildServiceWorker';
import { BuildUserScript } from './BuildUserScript';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { BuildPopup } from './BuildPopup';

export default async function handlebuild() {
  const config = getConfig();

  const data = fs.readFileSync(config.manifestJsonPath!);
  const manifest: chrome.runtime.ManifestV3 = JSON.parse(data.toString());

  const manifestFactory = new ManifestFactory(manifest);
  const headerFactory = new UserscriptHeaderFactory();

  const contentScripts = new BuildContentScript(manifest, manifestFactory);
  await contentScripts.build();

  const sw = new BuildServiceWorker(manifest, manifestFactory);
  await sw.build();

  const popup = new BuildPopup(manifest, manifestFactory);
  await popup.build();

  const userscript = new BuildUserScript(
    manifest,
    manifestFactory,
    headerFactory,
  );
  await userscript.build();

  copyLocales();
  copyPublic();

  /**
   * write manifest json
   */
  fs.writeFileSync(
    path.join(config.chromeOutputDir!, 'manifest.json'),
    JSON.stringify(manifestFactory.getWorkspace(), undefined, 2),
  );
}
