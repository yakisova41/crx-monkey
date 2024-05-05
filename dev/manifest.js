// @ts-check

/** @type {import('../packages/crx-monkey/dist/node/main').CrxMonkeyManifest} */
const manifest = {
  name: '__MSG_Name__',
  short_name: 'name',
  version: '1.0.0',
  manifest_version: 3,
  description: '__MSG_Description__',
  default_locale: 'en',

  content_scripts: [
    {
      matches: ['https://www.google.com/*'],
      js: ['src/contentScript/contentScript.ts'],
      css: ['src/contentScript/style.css'],
      run_at: 'document_idle',
      world: 'MAIN',
      connection_isolated: true,
      userscript_direct_inject: true,
    },
    {
      matches: ['https://www.google.com/*'],
      js: ['src/contentScript/contentScript2.ts'],
      run_at: 'document_idle',
    },
  ],
  background: {
    service_worker: 'src/sw/sw.ts',
  },
  icons: {
    16: 'public/icon/icon16.png',
    48: 'public/icon/icon48.png',
    128: 'public/icon/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
  },
};

export default manifest;
