import { promises } from 'fs';
import { CrxMonkeyConfig } from './types';
import path from 'path';

const configFileNameMatch = ['crx-monkey.config.js'];

const defaultConfig: CrxMonkeyConfig = {
  manifestJsonPath: path.join(process.cwd(), './manifest.json'),
  chromeOutputDir: path.join(process.cwd(), './dist/chrome'),
  userscriptOutput: path.join(process.cwd(), './dist/userscript/userscript.user.js'),
  esBuildOptions: {},
  devServer: {
    port: 3000,
    host: 'localhost',
    websocket: 3001,
  },
  publicDir: path.join(process.cwd(), './public'),
  userScriptHeader: [],
  importIconToUsercript: false,
  userscriptInjectPage: [],
  prettier: {
    format: true,
    options: { parser: 'babel' },
  },
};

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
          reject(
            new Error(
              ['Config file not found.', 'Please create "crx-monkey-config.js"'].join('\n'),
            ),
          );
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
    if (isKeyof<keyof CrxMonkeyConfig>(newConf, key) && value !== undefined) {
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
          void import(configPath).then((buildConfig) => {
            const rawConfig = buildConfig.default;
            configCahce = setDefaultConfig(rawConfig);
            resolve(configCahce);
          });
        } else {
          throw new Error('Can not import config');
        }
      })
      .catch((e) => {
        throw e;
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
    throw new Error('Config has not been loaded. Please using "loadConfig()"');
  }
}
