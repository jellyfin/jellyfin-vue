import compareVersions from 'compare-versions';
import { Context } from '@nuxt/types';
import { Auth } from '@nuxtjs/auth';
import { AxiosResponse } from 'axios';
import { AuthenticationResult } from '@jellyfin/client-axios';
import destr from 'destr';

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
    this.mount();
  }

  _setToken(token: string): void {
    // Set Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader('X-Emby-Authorization', token);
  }

  _setBaseUrl(serverUrl: string): void {
    this.$auth.ctx.app.$axios.setBaseURL(serverUrl);
  }

  _clearToken(): void {
    // Clear Authorization token for all axios requests
    this.$auth.ctx.app.$axios.setHeader('X-Emby-Authorization', false);
  }

  _setRememberMe(value: boolean): void {
    // Sets the remember me key which is used to relogin someone
    this.$auth.$storage.setState('rememberMe', value);
  }

  _getRememberMe(): boolean {
    return destr(this.$auth.$storage.getState('rememberMe'));
  }

  mount(): void {
    const serverUrl = this.$auth.ctx.app.store.state.servers.serverUsed.address;
    const accessToken = this.$auth.ctx.app.store.state.user.accessToken;

    if (serverUrl && accessToken) {
      this._setBaseUrl(serverUrl);
      this.setUserToken(accessToken);
    }
  }

  async mounted(): Promise<void> {
    if (!this._getRememberMe()) {
      await this.logout();
    }
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
    this.setUserToken('');

    // Check the version info and implicitly check for the manifest
    const serverInfo = (
      await this.$auth.ctx.app.$api.system.getPublicSystemInfo()
    ).data;

    // We need a version > 10.7.0 due to the use of /Users/Me
    if (
      serverInfo?.Version &&
      compareVersions.compare(serverInfo.Version, '10.7.0', '>=')
    ) {
      // Login using the Axios client
      const authenticateResponse =
        await this.$auth.ctx.app.$api.user.authenticateUserByName({
          authenticateUserByName: {
            Username: username,
            Pw: password
          }
        });

      if (
        authenticateResponse.data?.AccessToken &&
        authenticateResponse.data?.User
      ) {
        this.setUserToken(authenticateResponse.data.AccessToken);
        this.$auth.ctx.app.store.commit('user/SET_USER', {
          id: authenticateResponse.data.User.Id,
          accessToken: authenticateResponse.data.AccessToken
        });

        // Sets the remember me to true in order to first fetch the user once
        this._setRememberMe(true);

        // Set the remember me value
        this._setRememberMe(rememberMe);

        return authenticateResponse;
      }
    }

    throw new Error('serverVersionTooLow');
  }

  setUserToken(tokenValue: string): void {
    const token = `MediaBrowser Client="${this.$auth.ctx.app.store.state.deviceProfile.clientName}", Device="${this.$auth.ctx.app.store.state.deviceProfile.deviceName}", DeviceId="${this.$auth.ctx.app.store.state.deviceProfile.deviceId}", Version="${this.$auth.ctx.app.store.state.deviceProfile.clientVersion}", Token="${tokenValue}"`;

    this.$auth.setToken(this.name, token);
    this._setToken(token);

    if (tokenValue) {
      this.fetchUser();
    }
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

  async logout(): Promise<void> {
    // We set the 'loggedIn' variable to false as soon as possible in the logout chain, as nuxt/auth
    // doesn't set it until 'this.$auth.setUser(undefined)' is called. At that point, component relying
    // on $auth.user will fail, breaking the logout flow completely.
    this.$auth.$storage.setState('loggedIn', false);

    // This can fail if the baseUrl is not currently set
    try {
      await this.$auth.ctx.app.$api.session.reportSessionEnded();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    // Reset everything
    this.$auth.reset();
  }

  reset(): void {
    this._clearToken();
    this._setRememberMe(false);

    this.$auth.setUser(undefined);
    this.$auth.setToken(this.name, undefined);
  }
}
