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
