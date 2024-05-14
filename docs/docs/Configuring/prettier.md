# prettier

Formatter settings to be executed after build.

```js title="crx-monkey.config.js"
{
    prettier: {
        format: true,
        options: { parser: 'babel' },
    }
}
```

## prettier

### format
`boolean`

Whether to perform formatting.

### options
Configuration of prettier.

See [Configuration File · Prettier](https://prettier.io/docs/en/configuration.html) for details.