import { Plugin } from '@nuxt/types';

const appInitPlugin: Plugin = (context) => {
  if (context.store.state.user.serverUrl) {
    context.$axios.setBaseURL(context.store.state.user.serverUrl);
  }
};

export default appInitPlugin;
