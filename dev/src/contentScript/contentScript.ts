import { namedModule } from './module';
import {
  bypassMessage,
  bypassSendMessage,
  getExtensionId,
  getRunningRuntime,
} from '../../../packages/crx-monkey/dist/client/main';

console.log('!!Content script 1 has loaded.');

const runtime = getRunningRuntime();

console.log('Running by:', runtime);

if (runtime === 'Extension') {
  /**
   * Script running in MAIN world, if you use bypass function, you can bypass the feature of runtime.
   */
  getExtensionId().then((id) => {
    console.log('Extension id:', id);
  });

  bypassMessage((msg) => {
    console.log('Receved a message by service worker.');
    console.log(msg);
  });

  console.log('Send a message to service worker.');
  bypassSendMessage({ msg: 'Hi' });
}

namedModule();
