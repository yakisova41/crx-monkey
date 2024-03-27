import { promises } from 'fs';
import { CrxMonkeyConfig } from './types';
import path from 'path';

const configFileNameMatch = ['crx-monkey.config.js'];

interface DefaultValue {
  key: keyof CrxMonkeyConfig;
  value: any;
}

const defaultValues: DefaultValue[] = [
  {
    key: 'manifestJsonPath',
    value: path.join(process.cwd(), './manifest.json'),
  },
  {
    key: 'chromeOutputDir',
    value: path.join(process.cwd(), './dist/chrome'),
  },
  {
    key: 'userscriptOutput',
    value: path.join(process.cwd(), './dist/userscript/userscript.user.js'),
  },
  {
    key: 'esBuildOptions',
    value: {},
  },
  {
    key: 'devServer',
    value: {
      port: 3000,
      host: 'localhost',
      websocket: 3001,
    },
  },
  {
    key: 'publicDir',
    value: path.join(process.cwd(), './public'),
  },
  {
    key: 'userScriptHeader',
    value: [],
  },
];

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
              [
                'Config file not found.',
                'Please create "crx-monkey-config.js"',
              ].join('\n'),
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

function setDefaultConfig(config: CrxMonkeyConfig) {
  const newConf: CrxMonkeyConfig = structuredClone(config);

  defaultValues.forEach(({ key, value }) => {
    if (config[key] === undefined) {
      newConf[key] = value;
    }
  });

  return newConf;
}

let configCahce: null | CrxMonkeyConfig = null;
export async function loadConfig(): Promise<CrxMonkeyConfig> {
  return await new Promise((resolve) => {
    void getConfigPath()
      .then((configPath) => {
        if (configPath !== null) {
          void import(configPath).then((buildConfig) => {
            const rawConfig: CrxMonkeyConfig = buildConfig.default;
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

export function getConfig() {
  if (configCahce !== null) {
    return configCahce;
  } else {
    throw new Error('Config has not been loaded. Please using "loadConfig()"');
  }
}
