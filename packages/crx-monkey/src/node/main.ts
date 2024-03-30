import { loadConfig } from './config';
import { ConsoleApp } from './console';
import build from './handlers/build';
import dev from './handlers/dev';

await loadConfig();

const app = new ConsoleApp();
app.addCommand('build', build, []);
app.addCommand('dev', dev, []);
app.run();
