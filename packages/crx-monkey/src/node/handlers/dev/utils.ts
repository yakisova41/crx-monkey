import path from 'path';
import { getConfig } from 'src/node/config';

export function getDevelopDir() {
  const config = getConfig();
  if (config.manifestJsonPath !== undefined) {
    const manifestdir = path.dirname(config.manifestJsonPath);
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
  return [
    `const inject = ()=>{${scriptContent}}`,
    'const script = document.createElement("script");',
    'script.innerHTML = `(${inject.toString()})()`',
    'unsafeWindow.document.body.appendChild(script)',
    '',
  ].join('\n');
}
