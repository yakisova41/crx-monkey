# getExtensionId

:::tip
To use the API, `connection_isolated` must be set to true in manifest.

[Show Details](/docs/API/introduction#connector-required-api)
:::

Get the ID of the extension (the value of `chrome.runtime.id`).

```js
import { getExtensionId } from 'crx-monkey';

getExtensionId().then((id) => {
  console.log('id:', id);
});
```