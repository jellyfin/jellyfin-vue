import { Context } from '@nuxt/types';

/**
 * Middleware providing a redirect to the server selection page in case the
 * Axios base URL is the default (non-working) one.
 *
 * @param {Context} context - Nuxt application context
 * @returns {void}
 */
export default function (context: Context): void {
  if (
    !context.$axios.defaults.baseURL ||
    !context.store.state.servers.serverList.length
  ) {
    return context.redirect('/server/add');
  } else if (
    context.store.state.servers.serverList.length > 1 &&
    !context.store.state.servers?.serverUsed?.address
  ) {
    return context.redirect('/server/select');
  }
}
