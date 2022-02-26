import { Plugin, Context } from '@nuxt/types';
import watchAuth from './watchers/auth';

const piniaWatchers: Plugin = (ctx: Context) => {
  watchAuth(ctx);
};

export default piniaWatchers;
