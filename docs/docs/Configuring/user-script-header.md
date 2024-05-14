# userScriptHeader

You can set manually value of [UserScript header (another name Metadata)](https://www.tampermonkey.net/documentation.php).

Usually, header set automatically by crx-monkey using manifest data.

```js title="crx-monkey.config.js"
{
  userScriptHeader: [
    ['@author', 'me'],
    ['@grant', 'unsafeWindow'],
  ],    
}
```

## userScriptHeader
`[string, string]`

The first argument of the array should be the property name and the second argument should be the value.