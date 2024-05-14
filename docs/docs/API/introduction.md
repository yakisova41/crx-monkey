# API Introduction

Various APIs are available in **CRX MONKEY** from content scripts.

## Normal API
It can be used from any world in a content script as well as from a user script.

## Connector required API
This API is only available for `MAIN` World content scripts.

:::tip
To use the API, `connection_isolated` must be set to true in manifest.

```js title="manifest.js"
{ 
    ...
    "content_scripts": [
        {
            "js": ["src/contentScript/contentScript.ts"],
            "connection_isolated": true,
            "world": "MAIN"
        }
    ]
    ...
}
```
:::