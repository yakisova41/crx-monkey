// @ts-check

/** @type {import('../packages/crx-monkey/dist/node/main').NonLoadedCrxMonkeyConfig} */
const config = {
  importIconToUsercript: true,
  userscriptInjectPage: ['src/contentScript/contentScript.ts'],
};

export default config;
