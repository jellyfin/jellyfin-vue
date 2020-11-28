import { Plugin } from '@nuxt/types';

const appInitPlugin: Plugin = (context) => {
  // eslint-disable-next-line no-console
  console.error('setting base url');
  const { serverUsed } = context.store.state.servers;
  if (serverUsed) {
    context.$axios.setBaseURL(serverUsed.address);
  }
};

export default appInitPlugin;
