import { Plugin } from '@nuxt/types';

const userInitPlugin: Plugin = async (context) => {
  if (
    context.store.state.user.id &&
    context.store.state.user.serverUrl &&
    context.store.state.user.accessToken
  ) {
    context.$axios.setBaseURL(context.store.state.user.serverUrl);

    context.$auth.setUserToken(context.store.state.user.accessToken);

    const response = await context.$api.user.getUserById({
      userId: context.store.state.user.id
    });

    context.$auth.setUser(response.data);
  }
};

export default userInitPlugin;
