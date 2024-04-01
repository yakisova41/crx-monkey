import fse from 'fs-extra';
import path from 'path';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import { createMatchMap, getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';
import { loadStaticFile } from 'src/node/static/main';

export function createDevExtension(factory: ManifestFactory) {
  const fileName = 'crx-monkey-contentscript.js';

  const config = getConfig();
  const manifestWorkspace = factory.getWorkspace();
  const contentScripts = manifestWorkspace.content_scripts;

  if (contentScripts !== undefined) {
    const contentScriptPath = path.join(config.chromeOutputDir, fileName);

    fse.outputFile(contentScriptPath, generateContentScript(config.devServer));

    if (contentScripts !== undefined) {
      const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);
      const { allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

      factory.addContentScript([fileName], [], [...allMatches]);
    }
  }
}

function generateContentScript(devServer: { port: number; host: string; websocket: number }) {
  const code = loadStaticFile(path.join(import.meta.dirname, './static/contentScriptDev.js'), {
    'devServer.host': devServer.host,
    'devServer.websocket': String(devServer.websocket),
  });

  return code;
}
