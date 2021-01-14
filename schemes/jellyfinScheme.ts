import compareVersions from 'compare-versions';
import { Context } from '@nuxt/types';
import { Auth } from '@nuxtjs/auth';
import { AxiosResponse } from 'axios';
import { AuthenticationResult } from '@jellyfin/client-axios';

interface NuxtAuth extends Auth {
  // Fix the wonky DefinitelyTyped definition
  ctx: {
    app: Context;
  };
}

export default class JellyfinScheme {
  $auth: NuxtAuth;
  name = 'jellyfin';
  options: Record<string, unknown>;

  constructor(auth: NuxtAuth, options: Record<string, unknown>) {
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

  _setRememberMe(value: boolean): void {
    // Sets the remember me key which is used to relogin someone
    this.$auth.$storage.setUniversal('rememberMe', value);
  }

  _getRememberMe(): boolean {
    return this.$auth.$storage.getUniversal('rememberMe');
  }

  mounted(): Promise<never> {
    const token = this.$auth.syncToken(this.name);
    this._setToken(token);

    return this.$auth.fetchUserOnce();
  }

  async login({
    username,
    password,
    rememberMe
  }: {
    username: string;
    password: string;
    rememberMe: boolean;
  }): Promise<AxiosResponse<AuthenticationResult> | void> {
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
      this.$auth.ctx.app.store.commit('user/SET_USER', {
        id: authenticateResponse.data.User?.Id,
        accessToken: authenticateResponse.data.AccessToken
      });

      // Sets the remember me to true in order to first fetch the user once
      this._setRememberMe(true);

      // Fetch the user data
      await this.fetchUser();

      // Set the remember me value
      this._setRememberMe(rememberMe);

      return authenticateResponse;
    } else {
      throw new Error('serverVersionTooLow');
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

    if (!this._getRememberMe()) {
      await this.logout();
      return;
    }

    // Fetch the user, then set it in Nuxt Auth
    const user = (await this.$auth.ctx.app.$api.user.getCurrentUser()).data;

    this.$auth.setUser(user);
    await this.$auth.ctx.app.store.dispatch('displayPreferences/initState');
  }

  async logout(): Promise<never> {
    // We set the 'loggedIn' variable to false as soon as possible in the logout chain, as nuxt/auth
    // doesn't set it until 'this.$auth.setUser(undefined)' is called. At that point, component relying
    // on $auth.user will fail, breaking the logout flow completely.
    this.$auth.$storage.setState('loggedIn', false);
    await this.$auth.ctx.app.$api.session.reportSessionEnded();
    await this.$auth.ctx.app.store.dispatch('reset', { clearCritical: false });

    // Reset everything
    return this.$auth.reset();
  }

  reset(): Promise<void> {
    this._clearToken();
    this._setRememberMe(false);

    this.$auth.setUser(undefined);
    this.$auth.setToken(this.name, undefined);

    return Promise.resolve();
  }
}
