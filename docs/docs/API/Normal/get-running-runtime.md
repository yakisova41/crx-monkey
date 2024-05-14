# getRunningRuntime

Gets whether the script is running as an extension or as a Userscript.

```js
import { getRunningRuntime } from 'crx-monkey';

const runtime = getRunningRuntime();

console.log('Running by:', runtime);
```