# Bypass Message API

:::tip
To use the API, `connection_isolated` must be set to true in manifest.

[Show Details](/docs/API/introduction#connector-required-api)
:::


## bypassMessage
Bypass message reception (`chrome.runtime.onMessage.addListener`).

```js
import { bypassSendMessage } from 'crx-monkey';

bypassMessage((msg) => {
  console.log('Receved a message.', msg);
});
```

## bypassSendMessage
Bypass sending messages (`chrome.runtime.sendMessage`).

```js
import { bypassSendMessage } from 'crx-monkey';

bypassSendMessage({ msg: 'Hi' });
```