import { Context } from '@nuxt/types';

export default async (context: Context): Promise<void> => {
  if (
    context.store.state.user.id &&
    context.store.state.user.serverUrl &&
    context.store.state.user.accessToken
  ) {
    context.$axios.setBaseURL(context.store.state.user.serverUrl);

    context.$auth.setUserToken(context.store.state.user.accessToken);

    const response = await context.$userApi.getUserById({
      userId: context.store.state.user.id
    });

    context.$auth.setUser(response.data);
  }
};
