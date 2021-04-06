import { Plugin } from '@nuxt/types';

const appInitPlugin: Plugin = (context) => {
  const { serverUsed } = context.store.state.servers;

  if (serverUsed) {
    // Set axios base url to server address.
    context.$axios.setBaseURL(serverUsed.address);
  }

  if (context.app.router) {
    let path = context.route.path;

    // Set router base to path base.
    path = path.substring(0, path.indexOf('index.html'));
    context.app.router.options.base = path;
  }
};

export default appInitPlugin;
