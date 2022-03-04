import { Plugin, Context } from '@nuxt/types';
import watchAuth from './watchers/auth';
import watchSocket from './watchers/socket';

const piniaWatchers: Plugin = (ctx: Context) => {
  watchAuth(ctx);
  watchSocket(ctx);
};

export default piniaWatchers;
