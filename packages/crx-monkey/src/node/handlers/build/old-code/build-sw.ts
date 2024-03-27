import { build } from 'esbuild';
import { getConfig } from 'src/node/config';
import { ManifestFactory } from 'src/node/manifest-factory';
import manifestPlugin from 'esbuild-plugin-manifest';
import path from 'path';

/**
 * Build chrome extension serviceworker
 * @param manifest
 * @param factory
 */
export async function buildSW(
  manifest: chrome.runtime.ManifestV3,
  factory: ManifestFactory,
) {
  const sw = manifest.background?.service_worker;

  if (sw !== undefined) {
    await buildSwFile(sw, factory);
  }
}

/**
 * Build Service worker
 * @param jsFiles
 * @param factory
 */
async function buildSwFile(jspath: string, factory: ManifestFactory) {
  const config = getConfig();

  await build({
    entryPoints: [jspath],
    outdir: config.chromeOutputDir,
    logLevel: 'info',
    plugins: [
      manifestPlugin(),
      ...(config.esBuildOptions?.plugins !== undefined
        ? config.esBuildOptions?.plugins
        : []),
    ],
    metafile: true,
    ...config.esBuildOptions,
  }).then((res) => {
    const meta = res.metafile;
    if (meta !== undefined) {
      const outputPathes = Object.keys(meta.outputs);
      const outputFile = path.basename(path.basename(outputPathes[0]));
      factory.resolveSw(outputFile);
    }
  });
}
