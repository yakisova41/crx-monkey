import { build } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import manifestPlugin from 'esbuild-plugin-manifest';
import fs from 'fs';
import path from 'path';
import { getAllJsAndCSSByContentScripts } from 'src/node/manifest-factory/utils';

/**
 * Build chrome extension content script
 * @param manifest
 * @param factory
 */
export async function buildContentScript(
  manifest: chrome.runtime.ManifestV3,
  factory: ManifestFactory,
) {
  const contentScripts = manifest.content_scripts;

  if (contentScripts !== undefined) {
    const { jsFiles, cssFiles } = getAllJsAndCSSByContentScripts(contentScripts);
    await buildJsFiles(jsFiles, factory);
    await copyCssFiles(cssFiles, factory);
  }
}

/**
 * Build from all js file paths
 * Resolve that file path on contentscript to the path after build
 * @param jsFiles
 * @param factory
 */
async function buildJsFiles(jsFiles: string[], factory: ManifestFactory) {
  const config = getConfig();

  await Promise.all(
    jsFiles.map(async (js) => {
      await build({
        entryPoints: [js],
        outdir: config.chromeOutputDir,
        logLevel: 'info',
        plugins: [
          manifestPlugin(),
          ...(config.esBuildOptions?.plugins !== undefined ? config.esBuildOptions?.plugins : []),
        ],
        metafile: true,
        ...config.esBuildOptions,
      }).then((res) => {
        const meta = res.metafile;
        if (meta !== undefined) {
          const outputPathes = Object.keys(meta.outputs);
          const outputFile = path.basename(path.basename(outputPathes[0]));

          factory.resolveContentScript('js', js, outputFile);
        }
      });
    }),
  );
}

/**
 * Copy from all css file paths
 * Resolve that file path on contentscript to the path after copyed
 * @param cssFiles
 * @param factory
 */
async function copyCssFiles(cssFiles: string[], factory: ManifestFactory) {
  const config = getConfig();

  cssFiles.forEach((css, index) => {
    const fileName = path.basename(css);
    const split = fileName.split('.');
    split.splice(split.length - 2, 1, `${split[split.length - 2]}-${index}`);
    const outPutFilename = split.join('.');

    fs.copyFileSync(css, path.join(config.chromeOutputDir!, outPutFilename));

    factory.resolveContentScript('css', css, outPutFilename);
  });
}
