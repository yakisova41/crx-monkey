# devServer

The host and port used during development mode can be configured.

```js title="crx-monkey.config.js"
{
    devServer: {
        host: 'localhost',
        port: 3000,
        websocket: 3001,
        disableWsUserscript: false
    }
}
```

## devServer

### host

`string`

Common host name used by the development server

### port

`number`

Port to serve js resource.

### websocket

`number`

Port on websocket server for reloading

### disableWsUserscript

`boolean`

If websocket is blocked by WSS,
When this option is enabled, Websocket is not used for automatic reloading in development user scripts. Instead, it retrieves the code at 1000ms intervals and reloads if differences appear in the code.
