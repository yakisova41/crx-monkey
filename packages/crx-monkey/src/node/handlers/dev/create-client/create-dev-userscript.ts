import { getConfig } from 'src/node/config';
import path from 'path';
import fse from 'fs-extra';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';

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

function generateDevUserscriptCode(devServer: {
  port: number;
  host: string;
  websocket: number;
}) {
  const code = `
  const websocket = new WebSocket('ws://${devServer.host}:${devServer.websocket}');
  
  websocket.addEventListener("message", ({ data }) => {
    switch(data) {
      case "RELOAD_CSS" :
      case "RELOAD_CONTENT_SCRIPT" :
        location.reload();
        break;

      default:
        break;
    }
  });

  async function getResponse() {
    return new Promise((resolve) => {
      GM.xmlHttpRequest({
        url:'http://${devServer.host}:${devServer.port}/userscript',
        onload: (e) => {
          resolve(e.responseText);
        }
      });      
    });
  }

  getResponse()
    .then((code) => {
      const scriptElem = document.createElement("script");
      scriptElem.textContent = code;
      unsafeWindow.document.body.appendChild(scriptElem);
    });
  `;

  return code;
}
