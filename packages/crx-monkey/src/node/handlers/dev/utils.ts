import path from 'path';
import { getConfig } from 'src/node/config';

export function getDevelopDir() {
  const config = getConfig();
  if (config.manifestPath !== undefined) {
    const manifestdir = path.dirname(config.manifestPath);
    const developDir = path.resolve(manifestdir, 'crx_monkey_develop');
    return developDir;
  } else {
    throw new Error('');
  }
}

/**
 * Generate code of injecting script using DOM.
 * @param scriptContent
 * @returns
 */
export function generateInjectScriptCode(scriptContent: string) {
  const funcName = '__' + crypto.randomUUID().replaceAll('-', '_');

  return [
    `const ${funcName} = ()=>{${scriptContent}}`,
    'const script = document.createElement("script");',
    `script.innerHTML = \`(\${${funcName}.toString()})()\``,
    'unsafeWindow.document.body.appendChild(script)',
    '',
  ].join('\n');
}
