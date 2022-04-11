import { Plugin, Context } from '@nuxt/types';
import persistence from './plugins/persistence';
import preferencesSync from './plugins/preferencesSync';
import watchAuth from './watchers/auth';
import watchPlaybackReporting from './watchers/playbackManager';
import watchSocket from './watchers/socket';

const piniaPlugins: Plugin = (ctx: Context): void => {
  ctx.$pinia.use(persistence);
  ctx.$pinia.use(preferencesSync);
  watchAuth(ctx);
  watchSocket(ctx);
  watchPlaybackReporting(ctx);
};

export default piniaPlugins;
