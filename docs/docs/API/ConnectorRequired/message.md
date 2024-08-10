# Bypass Message API

:::tip
To use the API, `connection_isolated` must be set to true in manifest.

[Show Details](/docs/API/introduction#connector-required-api)
:::

## bypassMessage

Bypass message reception (`chrome.runtime.onMessage.addListener`).

```js
import { bypassSendMessage } from 'crx-monkey';

const listener = bypassMessage((msg) => {
  console.log('Receved a message.', msg);
});

listener.remove();
```

### remove()

Ends message waiting

## bypassSendMessage

Bypass sending messages (`chrome.runtime.sendMessage`).

```js
import { bypassSendMessage } from 'crx-monkey';

bypassSendMessage({ msg: 'Hi' });
```
