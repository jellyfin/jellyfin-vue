import { createPinia } from 'pinia';
import persistence from '../store/persistence';
import preferencesSync from '../store/preferencesSync';
import clientSettings from '../store/watchers/clientSettings';
import playbackManager from '../store/watchers/playbackManager';

const pinia = createPinia();
const plugins = [persistence, preferencesSync];
/**
 * TODO: Watchers are registered multiple times. Revisit this and, optionally perform a potential
 * migration from Pinia.
 */
const watchers = [playbackManager, clientSettings];

for (const p of [...plugins, ...watchers]) {
  pinia.use(p);
}

pinia.state;

export default pinia;
