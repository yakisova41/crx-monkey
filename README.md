# CRX MONKEY

TypescriptをChrome拡張機能とUserscriptへクラスプラットフォームにビルドするフレームワークです。

## Usage

```sh

```

## 設定ファイル

設定ファイル`crx-monkey.config.js`をプロジェクト内に必ず作成してください。

### 例

```js
const config = {
  manifestJsonPath: "./manifest.json"
  chromeOutputDir: "./dist/chrome"
  userscriptOutput: "./dist/userscript.user.js";
  esBuildOptions: {
    // ESbuild options
    minify: true
  };
  devServer: {
    port: 3000;
    host: "localhost";
    websocket: 3001;
  };
  publicDir: "./public";
  userScriptHeader: [
    ["@author", "me"],
    ["@grant", "unsageWindow"]
  ]
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
  port: 3000; // ファイルサーバーのポート番号
  host: 'localhost'; // 共通のホスト
  websocket: 3001; // 自動リロード用サーバーのポート番号
}
```

### publicDir

publicフォルダーのディレクトリパスを指定できます。
そのディレクトリはビルド時に`chromeOutputDir`で指定されたパスにコピーされます。

### userScriptHeader

追加のuserscriptのヘッダーを指定できます。

詳しいヘッダーの形式は[Documentation | Tampermonkey](https://www.tampermonkey.net/documentation.php?locale=en)を確認してください。
