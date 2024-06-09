# CRX MONKEY 🐵

<img src="https://raw.githubusercontent.com/yakisova41/crx-monkey/main/docs/static/img/logo.svg" width="150px">

Build Typescript into Chrome extension and Userscript

This is the build system created for [Return YouTube Comment Username
](https://github.com/yakisova41/return-youtube-comment-username).

[Documentation](https://yakisova41.github.io/crx-monkey/docs/intro)

## Feature

- The same code can be used in Chrome extension and userscript.
- Typescript can be used.
- The page, service_worker, and popup are automatically reloaded during development.
- Automatic code generation to execute code on the DOM
- Message passing from MAIN world to service_worker is available.
- Highspeed build by esbuild.

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
