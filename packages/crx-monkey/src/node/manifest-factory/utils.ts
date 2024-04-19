import fsExtra from 'fs-extra/esm';
import fs from 'fs';
import path from 'path';
import { getlocalesPath } from '../handlers/utils';

/**
 * Enumerate all js and css paths from conetnt_scripts in manifestjson
 * @param contentScripts
 * @param jsFiles
 * @param cssFiles
 * @returns
 */
export function createMatchMap(
  contentScripts: chrome.runtime.ManifestV3['content_scripts'],
  jsFiles: string[],
  cssFiles: string[],
) {
  const allMatches: string[] = [];
  const matchMap: Record<string, string[]> = {};

  if (contentScripts !== undefined) {
    jsFiles.forEach((jsPath) => {
      matchMap[jsPath] = [];
    });
    cssFiles.forEach((cssPath) => {
      matchMap[cssPath] = [];
    });

    contentScripts.forEach((contentScript) => {
      const matches = contentScript.matches;

      if (matches !== undefined) {
        matches.forEach((match) => {
          if (!allMatches.includes(match)) {
            allMatches.push(match);
          }
        });

        contentScript.js?.forEach((jsPath) => {
          matchMap[jsPath].push(...matches);
        });

        contentScript.css?.forEach((cssPath) => {
          matchMap[cssPath].push(...matches);
        });
      }
    });
  }

  return { matchMap, allMatches };
}

/**
 * Get all js and css paths in contentscripts
 * @param contentScripts
 * @returns
 */
export function getAllJsAndCSSByContentScripts(
  contentScripts: chrome.runtime.ManifestV3['content_scripts'],
) {
  const jsFiles: string[] = [];
  const cssFiles: string[] = [];

  if (contentScripts !== undefined) {
    contentScripts.forEach((contentScript) => {
      if (contentScript.js !== undefined) {
        contentScript.js.forEach((js) => {
          if (!jsFiles.includes(js)) {
            jsFiles.push(js);
          }
        });
      }

      if (contentScript.css !== undefined) {
        contentScript.css.forEach((css) => {
          if (!cssFiles.includes(css)) {
            cssFiles.push(css);
          }
        });
      }
    });
  }

  return {
    jsFiles,
    cssFiles,
  };
}

/**
 * Get messages in locale each language.
 * @param key
 * @returns
 */
export async function geti18nMessages(key: string) {
  const result: Record<string, string> = { en: key };
  const match = key.match(/__MSG_(.*)__/);

  if (match !== null) {
    const i18nKey = match[1];
    const localesPath = getlocalesPath();

    if (fsExtra.pathExistsSync(localesPath)) {
      const langKeys = getEnableLangs(localesPath);

      await Promise.all(
        langKeys.map(async (langKey) => {
          result[langKey] = await getMessage(langKey, i18nKey);
        }),
      );
    }
  }

  return result;
}

/**
 * Get the message in locale.
 * @param key
 * @returns
 */
async function getMessage(langKey: string, key: string) {
  const localesPath = getlocalesPath();
  const messagesJsonPath = path.resolve(localesPath, langKey, 'messages.json');

  const messagesJson: Record<string, { message: string }> =
    await fsExtra.readJSON(messagesJsonPath);

  const message = messagesJson[key].message;

  if (message !== undefined) {
    return message;
  } else {
    throw new Error(
      ['Can not found message property', `lang: ${langKey}`, `key: ${key}`].join('\n'),
    );
  }
}

/**
 * Get avaiable language.
 * Must include en in locale!!
 * @param localesPath
 * @returns
 */
function getEnableLangs(localesPath: string) {
  const langs = fs.readdirSync(localesPath);

  if (!langs.includes('en')) {
    throw new Error('No en in _locales folder');
  }

  return langs;
}
