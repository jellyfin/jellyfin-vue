import { Plugin, Context } from '@nuxt/types';
import persistence from './plugins/persistence';
import watchAuth from './watchers/auth';
import watchSocket from './watchers/socket';

const piniaPlugins: Plugin = (ctx: Context) => {
  ctx.$pinia.use(persistence);
  watchAuth(ctx);
  watchSocket(ctx);
};

export default piniaPlugins;
