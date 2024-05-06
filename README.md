[Japanese/日本語](https://github.com/yakisova41/crx-monkey/blob/main/README-ja.md)

# CRX MONKEY 🐵

Typescript to Chrome extension and Userscript

## Installation

It is easy to set up using `create-crx-monkey`.

```sh
npm create crx-monkey
```

Follow the prompts to set up.

```
Project name? any projectname...
Select a Language? Typescript / Javascript
```

## Usage

### Develop

```sh
npx crx-monkey dev
```

A development script will be started to automatically reload

### Build

```sh
npx crx-monkey build
```

Bundled scripts and extensions will be built

## Configuration file

Be sure to create a configuration file `crx-monkey.config.js` in your project.

Export objects by default in the configuration file.
(Not all items are required, so undefined will also work.)

> [!Note]
> If create-crx-monkey is used, it is generated automatically.

### Example

```js
// @ts-check

/** @type {import('crx-monkey').NonLoadedCrxMonkeyConfig} */
const config = {
  manifestPath: './manifest.js',
  chromeOutputDir: './dist/chrome',
  userscriptOutput: './dist/userscript.user.js',
  importIconToUsercript: true,
  esBuildOptions: {
    // ESbuild options
    minify: true,
  },
  devServer: {
    port: 3000,
    host: 'localhost',
    websocket: 3001,
  },
  publicDir: './public',
  userScriptHeader: [
    ['@author', 'me'],
    ['@grant', 'unsafeWindow'],
  ],
  userscriptInjectPage: ['src/contentScript/contentScript.ts'],
  prettier: {
    format: true,
    options: { parser: 'babel' },
  },
};

export default config;
```

### manifestPath

You can specify the path to `manifest.js`.

Only manifest_version 3 is available. For more details on manifest format, please refer to [Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/manifest?hl=ja).

### chromeOutputDir

You can specify the directory where Chrome extensions will be built.

### userscriptOutput

You can specify the file path where the Userscript will be built.

### esBuildOptions

Additional esbuild options can be specified. Please check [esbuild - API](https://esbuild.github.io/api/) for detailed option formats.

### devServer

You can specify the host and port of the server to be used when in development mode.

```js
devServer: {
  port: 3000, // port number of file server
  host: 'localhost', // hostname
  websocket: 3001, //  port number of auto reload server
}
```

### publicDir

You can specify a directory path for the public folder.
That directory will be copied to the path specified in `chromeOutputDir` at build time.

### userScriptHeader

Additional userscript headers can be specified.

For detailed header format, please check [Documentation | Tampermonkey](https://www.tampermonkey.net/documentation.php?locale=en).

### importIconToUsercript

Convert the 48-pixel icon specified in the `manifest.json` to base64 and set it to the userscript icon.

### userscriptInjectPage

You can specify the contentscript to be inserted using a script tag directly into the body accessed from the unsafeWindow when loading as a userscript.

### prettier

```js
prettier: {
  format: true, // フォーマットを実行するか？
  options: { parser: 'babel' },
},
```

Change the formatting configuration using [Prettier](https://github.com/prettier/prettier), which is performed after the Userscript build.

## Functions for Client

CRX-MONKEY provides a variety of utility functions that can be used from content scripts.

> [!Note]
> For Connector required functionality, set `connection_isolated` in `manifest.json`.
>
> ```js
>   "content_scripts": [
>     {
>       "js": ["src/contentScript/contentScript.ts"],
>       "connection_isolated": true
>     }
>   ]
> ```

### getRunningRuntime

Gets whether the script is running as an extension or as a Userscript.

| Is executable? | Method                               |
| -------------- | ------------------------------------ |
| ✅             | Chrome Extension running in MAIN     |
| ✅             | Chrome Extension running in ISOLATED |
| ✅             | Userscript                           |

```js
import { getRunningRuntime } from 'crx-monkey';

const runtime = getRunningRuntime();

console.log('Running by:', runtime);
```

### getExtensionId (Connector required)

Get the ID of the extension (the value of `chrome.runtime.id`).

| Is executable? | Method                               |
| -------------- | ------------------------------------ |
| ✅             | Chrome Extension running in MAIN     |
| ✅             | Chrome Extension running in ISOLATED |
| ❌             | Userscript                           |

```js
import { getExtensionId } from 'crx-monkey';

getExtensionId().then((id) => {
  console.log('id:', id);
});
```

### bypassMessage (Connector required)

Bypass message reception (`chrome.runtime.onMessage.addListener`).

| Is executable? | Method                           |
| -------------- | -------------------------------- |
| ✅             | Chrome Extension running in MAIN |
| ❌             | Userscript                       |

```js
import { bypassSendMessage } from 'crx-monkey';

bypassMessage((msg) => {
  console.log('Receved a message.', msg);
});
```

### bypassSendMessage (Connector required)

Bypass sending messages (`chrome.runtime.sendMessage`).

| Is executable? | Method                           |
| -------------- | -------------------------------- |
| ✅             | Chrome Extension running in MAIN |
| ❌             | Userscript                       |

```js
import { bypassSendMessage } from 'crx-monkey';

bypassSendMessage({ msg: 'Hi' });
```
