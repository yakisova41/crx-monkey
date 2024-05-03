// @ts-check

/** @type {import('../packages/crx-monkey/dist/node/main').NonLoadedCrxMonkeyConfig} */
const config = {
  importIconToUsercript: true,
  userscriptInjectPage: ['src/contentScript/contentScript.ts'],
  prettier: {
    format: true,
    options: {
      parser: 'babel',
      semi: true,
    },
  },
  publicDir: 'public',
};

export default config;
