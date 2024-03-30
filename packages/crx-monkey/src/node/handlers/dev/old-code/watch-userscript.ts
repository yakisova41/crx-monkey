import { BuildOptions, Plugin, PluginBuild, build, context } from 'esbuild';
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
import chokidar from 'chokidar';

export async function watchUserScript(
  manifest: chrome.runtime.ManifestV3,
  headerFactory: UserscriptHeaderFactory,
) {
  const config = getConfig();

  if (config.devServer === undefined) {
    throw new Error('Dev');
  }

  const contentScripts = manifest.content_scripts;

  if (contentScripts !== undefined) {
    const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);

    /**
     * If even one css is loaded, a GM_addStyle grant is added to the header
     */
    if (cssFiles.length !== 0) {
      headerFactory.push('@grant', 'GM_addStyle');
    }

    const { matchMap, allMatches } = createMatchMap(contentScripts, jsFiles, cssFiles);

    allMatches.forEach((match) => {
      headerFactory.push('@match', match);
    });

    headerFactory.push('@version', manifest.version);

    if (manifest.run_at !== undefined) {
      headerFactory.push('@run-at', convertChromeRunAtToUserJsRunAt(manifest.run_at));
    }

    const names = await geti18nMessages(manifest.name);
    Object.keys(names).forEach((lang) => {
      if (lang === 'en') {
        headerFactory.push('@name', names[lang]);
      } else {
        headerFactory.push(`@name:${lang}`, names[lang]);
      }
    });

    if (manifest.description !== undefined) {
      const descriptions = await geti18nMessages(manifest.description);
      Object.keys(descriptions).forEach((lang) => {
        if (lang === 'en') {
          headerFactory.push('@description', descriptions[lang]);
        } else {
          headerFactory.push(`@description:${lang}`, descriptions[lang]);
        }
      });
    }

    const headerCode = headerFactory.create();

    let cssResultStore: Record<string, Buffer> = await loadContentCssFiles(cssFiles);

    await watchCssFiles(cssFiles, (res) => {
      cssResultStore = res;
    });

    await watchContentJsFiles(jsFiles, (buildResultStore) => {
      const contentScriptcode = generateContentScriptcode(
        matchMap,
        buildResultStore,
        cssResultStore,
      );

      const buildedUserscript = [headerCode, contentScriptcode].join('\n');

      if (config.userscriptOutput !== undefined) {
        fse.outputFile(path.join(config.userscriptOutput), buildedUserscript);
      }
    });
  }
}

async function watchContentJsFiles(
  jsFiles: string[],
  onBuild: (buildResultStore: Record<string, Uint8Array>) => void,
) {
  const config = getConfig();
  const buildResultStore: Record<string, Uint8Array> = {};

  await Promise.all(
    jsFiles.map(async (js) => {
      const options: BuildOptions = {
        entryPoints: [js],
        outdir: config.chromeOutputDir,
        logLevel: 'warning',
        plugins: [
          {
            name: 'build-onend',
            setup: (build) => {
              build.onEnd(({ outputFiles }) => {
                if (outputFiles !== undefined) {
                  buildResultStore[js] = outputFiles[0].contents;
                }
                onBuild(buildResultStore);
              });
            },
          },
          ...(config.esBuildOptions?.plugins !== undefined ? config.esBuildOptions?.plugins : []),
        ],
        metafile: true,
        write: false,
        ...config.esBuildOptions,
      };

      await build(options);
      const ctx = await context(options);
      await ctx.watch();
    }),
  );

  return buildResultStore;
}

async function watchCssFiles(
  cssFiles: string[],
  onCopied: (cssResultStore: Record<string, Buffer>) => void,
) {
  const watcher = chokidar.watch(cssFiles, {});
  watcher.on('change', (cssPath) => {
    const cssResultStore: Record<string, Buffer> = {};

    cssFiles.forEach((css, index) => {
      const fileName = path.basename(css);
      const split = fileName.split('.');
      split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);

      const result = fs.readFileSync(css);
      cssResultStore[css] = result;
    });

    onCopied(cssResultStore);
  });
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
        scriptContent + `${isOr ? ' ||' : ''}location.href.match('${matchPattern}') !== null`;

      isOr = true;
    });

    scriptContent = scriptContent + ') {\n';

    if (jsBuildResultStore[filePath] !== undefined) {
      const buildResultText = new TextDecoder().decode(jsBuildResultStore[filePath]);
      scriptContent = scriptContent + buildResultText;
    }

    if (cssResultStore[filePath] !== undefined) {
      const cssText = cssResultStore[filePath].toString();
      scriptContent =
        scriptContent +
        [
          "const styleElement = document.createElement('style')",
          `styleElement.innerHTML = \`${cssText}\`;`,
          'document.head.appendChild(styleElement)',
        ].join('\n');
    }

    scriptContent = scriptContent + '}\n\n';
  });

  return scriptContent;
}
