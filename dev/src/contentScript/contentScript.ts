import { namedModule } from './module';
import { getPublicUrl, getRuntime } from '../../../packages/crx-monkey/dist/client/main';
console.log(getRuntime());
console.log(getPublicUrl());
namedModule();
