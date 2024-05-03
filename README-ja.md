# CRX MONKEY 🐵

TypescriptからChrome拡張とUserscriptへ簡単にビルド

## インストール

`create-crx-monkey`を使って簡単に設定できます。

```sh
npm create crx-monkey
```

プロンプトに従ってセットアップしてください。

```
Project name? any projectname...
Select a Language? Typescript / Javascript
```

## 使用方法

### 開発

```sh
npx crx-monkey dev
```

開発スクリプトが自動的にリロードされるようになります。

### ビルド

```sh
npx crx-monkey build
```

バンドルされているスクリプトと拡張機能がビルドされる。

## 設定ファイル

設定ファイル `crx-monkey.config.js` をプロジェクトに作成してください。

設定ファイルではデフォルトでオブジェクトをエクスポートします。
(全ての項目が必須というわけではないので、undefinedでも大丈夫です)。

> [!Note]
> create-crx-monkeyを使用した場合、自動的に生成されます。

### 例

```js
// @ts-check

/** @type {import('crx-monkey').NonLoadedCrxMonkeyConfig} */
const config = {
  manifestJsonPath: './manifest.json',
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

### manifestJsonPath

`manifest.json`へのパスを指定出来ます。

使用できる`manifest_version`は`3`のみです。
詳しいmanifestの形式は[Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/manifest?hl=ja)を確認してください。

### chromeOutputDir

Chrome拡張機能がビルドされるディレクトリを指定できます。

### userscriptOutput

Userscriptがビルドされるファイルパスを指定できます。

### esBuildOptions

esbuildのオプションを追加で指定できます。
詳しいオプションの形式は[esbuild - API](https://esbuild.github.io/api/)を確認してください。

### devServer

開発モード時に使用するサーバーのホストとポートを指定できます。

```js
devServer: {
  port: 3000, // ファイルサーバーのポート番号
  host: 'localhost', // 共通のホスト
  websocket: 3001, // 自動リロード用サーバーのポート番号
}
```

### publicDir

publicフォルダーのディレクトリパスを指定できます。
そのディレクトリはビルド時に`chromeOutputDir`で指定されたパスにコピーされます。

### userScriptHeader

追加のuserscriptのヘッダーを指定できます。

詳しいヘッダーの形式は[Documentation | Tampermonkey](https://www.tampermonkey.net/documentation.php?locale=en)を確認してください。

### importIconToUsercript

`manifest.json`に指定された48ピクセルのiconをbase64に変換してuserscriptのiconに設定します

### userscriptInjectPage

userscriptとして読み込む際にunsafeWindowからアクセスしたbodyへ直接scriptタグを使用して挿入するcontentscriptを指定できます。

### prettier

```js
prettier: {
  format: true, // フォーマットを実行するか？
  options: { parser: 'babel' },
},
```

Userscriptビルド後に実行する[Prettier](https://github.com/prettier/prettier)を使用したフォーマットを構成します。

## Client用の関数

CRX-MONKEYはコンテントスクリプトから使用できるさまざまなユーティリティ関数を提供します。

> [!Note]
> Connector requiredの機能は`manifest.json`に`connection_isolated`を設定してください。
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

スクリプトが拡張機能として実行されているか、Userscriptとして実行されているかを取得します。

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

拡張機能のID(`chrome.runtime.id`の値)を取得します。

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

メッセージの受信(`chrome.runtime.onMessage.addListener`)をバイパスします。

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

メッセージの送信(`chrome.runtime.sendMessage`)をバイパスします。

| Is executable? | Method                           |
| -------------- | -------------------------------- |
| ✅             | Chrome Extension running in MAIN |
| ❌             | Userscript                       |

```js
import { bypassSendMessage } from 'crx-monkey';

bypassSendMessage({ msg: 'Hi' });
```
