# importIconToUserscript

Convert the 48size icon specified in manifest.js to base64 and set the userscript icon.

:::tip
If the icon is not set in manifest, an error will occur.
:::

```js title="crx-monkey.config.js"
{
    importIconToUserscript: true,
}
```

```js title="manifest.js"
{
    ...
    icons: {
        16: 'public/icon/icon16.png',
        48: 'public/icon/icon48.png',
        128: 'public/icon/icon128.png',
    },
    ...
}
```

## importIconToUserscript

`boolean`
