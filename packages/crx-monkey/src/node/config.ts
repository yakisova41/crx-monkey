import { promises } from 'fs';
import { CrxMonkeyConfig } from './types';
import path from 'path';
import consola from 'consola';
import { resolveFilePath } from './file';

const configFileNameMatch = ['crx-monkey.config.js'];

const defaultConfig: CrxMonkeyConfig = {
  manifestPath: path.join(process.cwd(), './manifest.js'),
  chromeOutputDir: path.join(process.cwd(), './dist/chrome'),
  userscriptOutput: path.join(process.cwd(), './dist/userscript/userscript.user.js'),
  esBuildOptions: {},
  devServer: {
    port: 3000,
    host: 'localhost',
    websocket: 3001,
    disableWsUserscript: false,
  },
  publicDir: path.join(process.cwd(), './public'),
  userScriptHeader: [],
  importIconToUserscript: false,
  prettier: {
    format: true,
    options: { parser: 'babel' },
  },
  importIconToUsercript: false,
};

const warnKeys: { name: string; replace: string }[] = [
  // This propetery of typo had used until version 0.7.0
  { name: 'importIconToUsercript', replace: 'importIconToUserscript' },
];

/**
 * Get the path to crx-monkey.config.js.
 * @returns
 */
async function getConfigPath(): Promise<string | null> {
  return await new Promise((resolve, reject) => {
    let dir = process.cwd();

    const searchThen = (result: string | null): void => {
      if (result !== null) {
        resolve(dir + '/' + result);
      } else {
        const splited = dir.split('/');
        if (splited.length === 1) {
          reject(new Error('Config file not found. Please create "crx-monkey-config.js"'));
        } else {
          splited.pop();
          dir = splited.join('/');
          void search(dir).then(searchThen);
        }
      }
    };

    void search(dir).then(searchThen);
  });
}

/**
 * Find config file.
 * @param dir
 * @returns
 */
async function search(dir: string): Promise<string | null> {
  return await new Promise((resolve) => {
    void promises.readdir(dir + '/').then((files) => {
      files.forEach((fileName) => {
        configFileNameMatch.forEach((fileNamePattern) => {
          if (fileName === fileNamePattern) {
            resolve(fileName);
          }
        });
      });

      resolve(null);
    });
  });
}

/**
 * [Type guard] Is the key contained object??
 * @param obj
 * @param key
 * @returns
 */
function isKeyof<T>(obj: object, key: T | string): key is T {
  let result = false;
  Object.keys(obj).forEach((objkey) => {
    if (key === objkey) {
      result = true;
    }
  });
  return result;
}

/**
 * If value in config is undefined, that value will be default value.
 * @param config LKoaded config data.
 * @returns
 */
function setDefaultConfig(config: Record<string, never>) {
  const newConf: CrxMonkeyConfig = {
    ...defaultConfig,
  };

  Object.entries(config).forEach(([key, value]) => {
    let added = false;

    warnKeys.forEach(({ name, replace }) => {
      if (name === key) {
        consola.warn(`The property "${name}" in config are no longer used.`);

        if (isKeyof<keyof CrxMonkeyConfig>(newConf, replace)) {
          newConf[replace] = value;
          added = true;
        }
      }
    });

    if (isKeyof<keyof CrxMonkeyConfig>(newConf, key) && value !== undefined && !added) {
      if (typeof newConf[key] === typeof value) {
        newConf[key] = value;
      }
    }
  });

  return newConf;
}

/**
 * Loaded config data.
 * It is null when before use loadConfig() use.
 */
let configCahce: null | CrxMonkeyConfig = null;

/**
 * Load config file in project.
 * @returns
 */
export async function loadConfig(): Promise<CrxMonkeyConfig> {
  return await new Promise((resolve) => {
    void getConfigPath()
      .then((configPath) => {
        if (configPath !== null) {
          const confPath = path.resolve(configPath);

          void import(resolveFilePath(confPath)).then((buildConfig) => {
            const rawConfig = buildConfig.default;
            configCahce = setDefaultConfig(rawConfig);
            resolve(configCahce);
          });
        } else {
          throw consola.error(new Error('Can not import config'));
        }
      })
      .catch((e) => {
        throw consola.error(e);
      });
  });
}

/**
 * Get config that had loaded.
 * Must run loadConfig() before use!
 * @returns
 */
export function getConfig() {
  if (configCahce !== null) {
    return configCahce;
  } else {
    throw consola.error(new Error('Config has not been loaded. Please using "loadConfig()"'));
  }
}
