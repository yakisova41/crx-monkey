import { getConfig } from '../config';
import path from 'path';
import fse from 'fs-extra';

export function copyLocales() {
  const localesPath = getlocalesPath();
  const config = getConfig();

  if (fse.pathExistsSync(localesPath) && config.chromeOutputDir !== undefined) {
    fse.copy(localesPath, path.join(config.chromeOutputDir, '_locales'));
  }
}

export function getlocalesPath() {
  const config = getConfig();

  if (config.manifestJsonPath) {
    const dir = path.dirname(config.manifestJsonPath);

    return path.resolve(dir, '_locales');
  } else {
    throw new Error('');
  }
}

export function copyPublic() {
  const config = getConfig();
  const publicDir = config.publicDir;

  if (
    publicDir !== undefined &&
    fse.pathExistsSync(publicDir) &&
    config.chromeOutputDir !== undefined
  ) {
    fse.copy(
      publicDir,
      path.join(config.chromeOutputDir, path.basename(publicDir)),
    );
  }
}
