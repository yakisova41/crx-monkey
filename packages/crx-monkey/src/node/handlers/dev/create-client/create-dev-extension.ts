import fse from 'fs-extra';
import path from 'path';
import { getConfig } from 'src/node/config';
import { build } from 'esbuild';
import { ManifestFactory } from 'src/node/manifest-factory';

export function createDevExtension(factory: ManifestFactory) {
  const fileName = 'crx-monkey-contentscript.js';

  const config = getConfig();

  if (config.chromeOutputDir !== undefined && config.devServer !== undefined) {
    const contentScriptPath = path.join(config.chromeOutputDir, fileName);

    fse.outputFile(contentScriptPath, generateContentScript(config.devServer));

    factory.addContentScript([fileName], [], ['https://*/*', 'http://*/*']);
  }
}

function generateContentScript(devServer: { port: number; host: string; websocket: number }) {
  const code = `
    const websocket = new WebSocket(\`ws://${devServer.host}:${devServer.websocket}\`);
    
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
  `;

  return code;
}
