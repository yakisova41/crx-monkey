# devServer

The host and port used during development mode can be configured.

```js title="crx-monkey.config.js"
{
    devServer: {
        host: 'localhost',
        port: 3000,
        websocket: 3001,
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