import { getConfig } from '../config';
import path from 'path';
import fse from 'fs-extra';
import { Plugin } from 'esbuild';

/**
 * Copy the locales dir to dist.
 */
export function copyLocales() {
  const localesPath = getlocalesPath();
  const config = getConfig();

  if (fse.pathExistsSync(localesPath) && config.chromeOutputDir !== undefined) {
    fse.copy(localesPath, path.join(config.chromeOutputDir, '_locales'));
  }
}

/**
 * If selected the path, using it.
 * But not selected, this function return the path of _locales dir in parent dir of manifest.json.
 */
export function getlocalesPath() {
  const config = getConfig();

  if (config.manifestPath) {
    const dir = path.dirname(config.manifestPath);

    return path.resolve(dir, '_locales');
  } else {
    throw new Error('');
  }
}

/**
 * Copy the public dir to dist.
 */
export function copyPublic() {
  const config = getConfig();
  const publicDir = path.join(process.cwd(), config.publicDir);
  if (publicDir !== undefined && fse.pathExistsSync(publicDir)) {
    fse.copy(publicDir, path.join(config.chromeOutputDir, path.basename(publicDir)));
  }
}

/**
 * Define an arbitrary id in the build result.
 * @param id
 * @returns
 */
export function defineCrxContentBuildIdPlugin(id: string) {
  const devSwPlugin: Plugin = {
    name: 'define-crx-content-build-id-plugin',
    setup: (build) => {
      build.onEnd((res) => {
        const meta = res.metafile;
        if (meta !== undefined) {
          const outputPathes = Object.keys(meta.outputs);
          const buildResult = fse.readFileSync(outputPathes[0]);

          fse.writeFileSync(
            outputPathes[0],
            [`window.__CRX_CONTENT_BUILD_ID = "${id}";\n`, buildResult].join('\n'),
          );
        }
      });
    },
  };
  return devSwPlugin;
}

/**
 * Remove dist dir if it exists.
 */
export async function cleanupDist() {
  const { chromeOutputDir, userscriptOutput } = getConfig();

  await fse.exists(chromeOutputDir).then(async (isChromeExist) => {
    if (isChromeExist) {
      await fse.remove(chromeOutputDir);
    }
  });

  await fse.exists(userscriptOutput).then(async (isUserscriptExist) => {
    if (isUserscriptExist) {
      await fse.remove(userscriptOutput);
    }
  });
}
