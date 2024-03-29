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
    ['@grant', 'unsageWindow'],
  ],
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
