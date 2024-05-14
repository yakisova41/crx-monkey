# Configuring Introduction

Usually, config file named **crx-monkey.config.js** is auto created if using **create-crx-monkey**.

The most basic config file looks like this:

```js title="crx-monkey.config.js"
// @ts-check

/** @type {import('crx-monkey').NonLoadedCrxMonkeyConfig} */
const config = {
};

export default config;
```