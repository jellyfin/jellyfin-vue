import { Context } from '@nuxt/types';
import { Auth } from '@nuxtjs/auth';
import compareVersions from 'compare-versions';

interface NuxtAuth extends Auth {
  // Fix the wonky DefinitelyTyped definition
  ctx: {
    app: Context;
  };
}

export default class JellyfinScheme {
  $auth: NuxtAuth;
  name = 'jellyfin';
  options: Record<string, any>;

  constructor(auth: NuxtAuth, options: Record<string, any>) {
    this.$auth = auth;

    this.options = Object.assign({}, {}, options);
  }

  _setToken(token: string): void {
    // Set Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader('X-Emby-Authorization', token);
  }

  _clearToken(): void {
    // Clear Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader('X-Emby-Authorization', false);
  }

  mounted(): Promise<never> {
    const token = this.$auth.syncToken(this.name);
    this._setToken(token);

    return this.$auth.fetchUserOnce();
  }

  async login({ username, password }: { username: string; password: string }) {
    try {
      // Ditch any leftover local tokens before attempting to log in
      await this.$auth.reset();

      // Set the empty header needed for Jellyfin to not yell at us
      const token = `MediaBrowser Client="${this.$auth.ctx.app.store.state.deviceProfile.clientName}", Device="${this.$auth.ctx.app.store.state.deviceProfile.deviceName}", DeviceId="${this.$auth.ctx.app.store.state.deviceProfile.deviceId}", Version="${this.$auth.ctx.app.store.state.deviceProfile.clientVersion}", Token=""`;
      this._setToken(token);

      // Check the version info and implicitly check for the manifest
      const serverInfo = (
        await this.$auth.ctx.app.$api.system.getPublicSystemInfo()
      ).data;

      // We need a version > 10.7.0 due to the use of /Users/Me
      if (compareVersions.compare(serverInfo.Version || '', '10.7.0', '>=')) {
        // Login using the Axios client
        const authenticateResponse = await this.$auth.ctx.app.$api.user.authenticateUserByName(
          {
            authenticateUserByName: {
              Username: username,
              Pw: password
            }
          }
        );

        // Set the user's token
        const userToken = `MediaBrowser Client="${this.$auth.ctx.app.store.state.deviceProfile.clientName}", Device="${this.$auth.ctx.app.store.state.deviceProfile.deviceName}", DeviceId="${this.$auth.ctx.app.store.state.deviceProfile.deviceId}", Version="${this.$auth.ctx.app.store.state.deviceProfile.clientVersion}", Token="${authenticateResponse.data.AccessToken}"`;
        this.$auth.setToken(this.name, userToken);
        this._setToken(userToken);

        // Fetch the user data
        await this.fetchUser();

        return authenticateResponse;
      } else {
        throw new Error('serverVersionTooLow');
      }
    } catch (error) {
      // TODO: This is all a bit whack, clean it up later
      let errorMessage = 'unexpectedError';

      if (!error.response) {
        errorMessage = 'serverNotFound';
      } else if (
        error.response.status === 500 ||
        error.response.status === 401
      ) {
        errorMessage = 'incorrectUsernameOrPassword';
      } else if (error.response.status === 400) {
        errorMessage = 'badRequest';
      }

      this.$auth.ctx.app.store.dispatch('snackbar/pushSnackbarMessage', {
        message: errorMessage,
        color: 'error'
      });
    }
  }

  setUserToken(tokenValue: string): Promise<void> {
    const token = `MediaBrowser Client="${this.$auth.ctx.app.store.state.deviceProfile.clientName}", Device="${this.$auth.ctx.app.store.state.deviceProfile.deviceName}", DeviceId="${this.$auth.ctx.app.store.state.deviceProfile.deviceId}", Version="${this.$auth.ctx.app.store.state.deviceProfile.clientVersion}", Token="${tokenValue}"`;
    this.$auth.setToken(this.name, token);
    this._setToken(token);

    return this.fetchUser();
  }

  async fetchUser(): Promise<void> {
    // Token is not available
    if (!this.$auth.getToken(this.name)) {
      return;
    }

    // Fetch the user, then set it in Nuxt Auth
    const user = (await this.$auth.ctx.app.$api.user.getCurrentUser()).data;
    this.$auth.setUser(user);
  }

  async logout(): Promise<never> {
    await this.$auth.ctx.app.$api.session.reportSessionEnded();

    // Reset everything
    return this.$auth.reset();
  }

  reset(): Promise<void> {
    this._clearToken();

    this.$auth.setUser(undefined);
    this.$auth.setToken(this.name, undefined);

    return Promise.resolve();
  }
}
