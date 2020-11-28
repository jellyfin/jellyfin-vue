import { Plugin } from '@nuxt/types';

const appInitPlugin: Plugin = (context) => {
  const { serverUsed } = context.store.state.servers;
  if (serverUsed) {
    context.$axios.setBaseURL(serverUsed.address);
  }
};

export default appInitPlugin;
