import { getConfig } from 'src/node/config';
import path from 'path';
import fse from 'fs-extra';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { loadStaticFile } from 'src/node/static/main';
import { CrxMonkeyConfig } from 'src/node/types';

export function createDevUserscript(headerFactory: UserscriptHeaderFactory) {
  const fileName = 'crx-monkey-dev.user.js';

  const config = getConfig();

  if (config.userscriptOutput !== undefined && config.devServer !== undefined) {
    const userscriptDistDir = path.dirname(config.userscriptOutput);
    const devUserscriptPath = path.join(userscriptDistDir, fileName);

    headerFactory.push('@grant', 'GM.xmlHttpRequest');
    headerFactory.push('@grant', 'unsafeWindow');
    const headerCode = headerFactory.create();

    fse.outputFile(
      devUserscriptPath,
      [headerCode, generateDevUserscriptCode(config.devServer)].join('\n'),
    );
  }
}

function generateDevUserscriptCode(devServer: CrxMonkeyConfig['devServer']) {
  let code: string;

  if (devServer.disableWsUserscript) {
    code = loadStaticFile(path.join(import.meta.dirname, './static/userScriptDevUseGmXhr.js'), {
      'devServer.host': devServer.host,
      'devServer.port': String(devServer.port),
    });
  } else {
    code = loadStaticFile(path.join(import.meta.dirname, './static/userScriptDev.js'), {
      'devServer.host': devServer.host,
      'devServer.port': String(devServer.port),
      'devServer.websocket': String(devServer.websocket),
    });
  }

  return code;
}
