import { loadConfig } from './config';
import { ConsoleApp } from './console';
import build from './handlers/build';
import dev from './handlers/dev';
import pkg from '../../package.json';

await loadConfig();

const app = new ConsoleApp('CRX MONKEY', pkg.version);
app.addCommand('build', build, []);
app.addCommand('dev', dev, []);
app.run();
