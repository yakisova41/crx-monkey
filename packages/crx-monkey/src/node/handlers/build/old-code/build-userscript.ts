import { build } from 'esbuild';
import { getConfig } from 'src/node/config';
import {
  createMatchMap,
  getAllJsAndCSSByContentScripts,
  geti18nMessages,
} from 'src/node/manifest-factory/utils';
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra/esm';
import { UserscriptHeaderFactory } from 'src/node/userscript-header-factory';
import { convertChromeRunAtToUserJsRunAt } from 'src/node/userscript-header-factory/utils';

export async function buildUserScript(manifest: chrome.runtime.ManifestV3) {
  const header = new UserscriptHeaderFactory();
  const config = getConfig();

  const contentScripts = manifest.content_scripts;

  if (contentScripts !== undefined) {
    const { jsFiles, cssFiles } =
      getAllJsAndCSSByContentScripts(contentScripts);

    const buildResultStore = await buildContentJsFiles(jsFiles);

    const cssResultStore = await loadContentCssFiles(cssFiles);

    /**
     * If even one css is loaded, a GM_addStyle grant is added to the header
     */
    if (cssFiles.length !== 0) {
      header.push('@grant', 'GM_addStyle');
    }

    const { matchMap, allMatches } = createMatchMap(
      contentScripts,
      jsFiles,
      cssFiles,
    );

    const contentScriptcode = generateContentScriptcode(
      matchMap,
      buildResultStore,
      cssResultStore,
    );

    allMatches.forEach((match) => {
      header.push('@match', match);
    });

    header.push('@version', manifest.version);

    if (manifest.run_at !== undefined) {
      header.push('@run-at', convertChromeRunAtToUserJsRunAt(manifest.run_at));
    }

    const names = await geti18nMessages(manifest.name);
    Object.keys(names).forEach((lang) => {
      if (lang === 'en') {
        header.push('@name', names[lang]);
      } else {
        header.push(`@name:${lang}`, names[lang]);
      }
    });

    if (manifest.description !== undefined) {
      const descriptions = await geti18nMessages(manifest.description);
      Object.keys(descriptions).forEach((lang) => {
        if (lang === 'en') {
          header.push('@description', descriptions[lang]);
        } else {
          header.push(`@description:${lang}`, descriptions[lang]);
        }
      });
    }

    const headerCode = header.create();

    const buildedUserscript = [headerCode, contentScriptcode].join('\n');

    if (config.userscriptOutput !== undefined) {
      fse.outputFile(path.join(config.userscriptOutput), buildedUserscript);
    }
  }
}

async function buildContentJsFiles(jsFiles: string[]) {
  const config = getConfig();
  const buildResultStore: Record<string, Uint8Array> = {};

  await Promise.all(
    jsFiles.map(async (js) => {
      await build({
        entryPoints: [js],
        outdir: config.chromeOutputDir,
        logLevel: 'silent',
        plugins: [
          ...(config.esBuildOptions?.plugins !== undefined
            ? config.esBuildOptions?.plugins
            : []),
        ],
        metafile: true,
        write: false,
        ...config.esBuildOptions,
      }).then((res) => {
        if (res.outputFiles !== undefined) {
          buildResultStore[js] = res.outputFiles[0].contents;
        }
      });
    }),
  );

  return buildResultStore;
}

async function loadContentCssFiles(cssFiles: string[]) {
  const cssResultStore: Record<string, Buffer> = {};

  cssFiles.forEach((css, index) => {
    const fileName = path.basename(css);
    const split = fileName.split('.');
    split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);

    const result = fs.readFileSync(css);
    cssResultStore[css] = result;
  });

  return cssResultStore;
}

/**
 * Build content scripts for each match and generate code to restrict execution for each match using if
 * Also, CSS is loaded using GM_addStyle
 * @param matchMap
 * @param jsBuildResultStore
 * @param cssResultStore
 * @returns
 */
function generateContentScriptcode(
  matchMap: Record<string, string[]>,
  jsBuildResultStore: Record<string, Uint8Array>,
  cssResultStore: Record<string, Buffer>,
) {
  let scriptContent = '';
  Object.keys(matchMap).forEach((filePath) => {
    const matches = matchMap[filePath];

    scriptContent = scriptContent + 'if (';

    let isOr = false;
    matches.forEach((matchPattern) => {
      scriptContent =
        scriptContent +
        `${isOr ? ' ||' : ''}location.href.match('${matchPattern}') !== null`;

      isOr = true;
    });

    scriptContent = scriptContent + ') {\n';

    if (jsBuildResultStore[filePath] !== undefined) {
      const buildResultText = new TextDecoder().decode(
        jsBuildResultStore[filePath],
      );
      scriptContent = scriptContent + buildResultText;
    }

    if (cssResultStore[filePath] !== undefined) {
      const cssText = cssResultStore[filePath].toString();
      scriptContent = scriptContent + `GM_addStyle(\`\n${cssText}\`);\n`;
    }

    scriptContent = scriptContent + '}\n\n';
  });

  return scriptContent;
}
