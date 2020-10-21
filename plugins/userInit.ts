import { Plugin } from '@nuxt/types';

const userInitPlugin: Plugin = async (context) => {
  if (
    context.store.state.user.id &&
    context.store.state.user.serverUrl &&
    context.store.state.user.accessToken
  ) {
    context.$axios.setBaseURL(context.store.state.user.serverUrl);

    const accessToken = `MediaBrowser Client="${context.store.state.deviceProfile.clientName}", Device="${context.store.state.deviceProfile.deviceName}", DeviceId="${context.store.state.deviceProfile.deviceId}", Version="${context.store.state.deviceProfile.clientVersion}", Token="${context.store.state.user.accessToken}"`;
    context.$auth.setUserToken(accessToken);

    const response = await context.$api.user.getUserById({
      userId: context.store.state.user.id
    });

    context.$auth.setUser(response.data);
  }
};

export default userInitPlugin;
