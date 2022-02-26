import { Plugin, Context } from '@nuxt/types';
import persistence from './plugins/persistence';

const piniaPlugins: Plugin = (ctx: Context) => {
  ctx.$pinia.use(persistence);
};

export default piniaPlugins;
