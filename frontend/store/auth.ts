import Vue from 'vue';
import { PublicSystemInfo, UserDto } from '@jellyfin/client-axios';
import { defineStore } from 'pinia';
import { deviceProfileStore, snackbarStore } from '.';
import { AxiosError } from 'axios';

export interface ServerInfo extends PublicSystemInfo {
  PublicAddress: string;
  isDefault: boolean;
}

export interface AuthState {
  servers: ServerInfo[];
  currentServerIndex: number;
  currentUserIndex: number;
  users: UserDto[];
  rememberMe: boolean;
  /**
   * Key: userId. Value: Access token
   */
  accessTokens: { [key: string]: string };
}

export const authStore = defineStore('auth', {
  state: () => {
    return {
      servers: [],
      currentServerIndex: -1,
      currentUserIndex: -1,
      users: [],
      rememberMe: true,
      accessTokens: {}
    } as AuthState;
  },
  actions: {
    /**
     * Adds a new server to the store and sets it as the default one
     */
    async connectServer(serverUrl: string, isDefault?: boolean) {
      serverUrl = serverUrl.replace(/\/$/, '');
      const snackbar = snackbarStore();
      this.$nuxt.$axios.setBaseURL(serverUrl);
      this.setAxiosHeader();

      let data: ServerInfo;

      try {
        data = (await this.$nuxt.$api.system.getPublicSystemInfo())
          .data as ServerInfo;
        data.PublicAddress = serverUrl;
        data.isDefault = isDefault ? true : false;
      } catch (err) {
        snackbar.push(this.$nuxt.i18n.t('login.serverNotFound'), 'error');
        throw new Error(err as string);
      }

      const semverMajor = parseInt(data.Version?.split('.')[0] as string);
      const semverMinor = parseInt(data.Version?.split('.')[1] as string);
      const isServerVersionSupported =
        semverMajor > 10 || (semverMajor === 10 && semverMinor >= 7);

      if (isServerVersionSupported) {
        if (!data.StartupWizardCompleted) {
          this.$nuxt.redirect('/wizard');
        } else {
          if (!this.getServerById(data.Id)) {
            this.servers.push(data);
          }

          this.currentServerIndex = this.servers.indexOf(
            this.servers.find(
              (serv) => serv.PublicAddress === serverUrl
            ) as ServerInfo
          );
        }
      } else {
        snackbar.push(this.$nuxt.i18n.t('login.serverVersionTooLow'), 'error');
        throw new Error('Server version is too low');
      }
    },
    /**
     * Logs the user to the current server
     */
    async loginUser(username: string, password: string, rememberMe: boolean) {
      if (!this.currentServer) {
        throw new Error('There is no server in use');
      }

      try {
        const authenticateResponse = (
          await this.$nuxt.$api.user.authenticateUserByName({
            authenticateUserByName: {
              Username: username,
              Pw: password
            }
          })
        ).data;

        this.rememberMe = rememberMe;
        if (authenticateResponse.User?.Id && authenticateResponse.AccessToken) {
          Vue.set(
            this.accessTokens,
            authenticateResponse.User?.Id,
            authenticateResponse.AccessToken
          );

          this.users.push(authenticateResponse.User);
          this.currentUserIndex = this.users.indexOf(authenticateResponse.User);
          this.setAxiosHeader();
        }
      } catch (err) {
        const snackbar = snackbarStore();
        const error = err as AxiosError;
        let errorMessage = 'unexpectedError';

        if (!error.response) {
          errorMessage =
            error.message || this.$nuxt.i18n.t('login.serverNotFound');
        } else if (
          error.response.status === 500 ||
          error.response.status === 401
        ) {
          errorMessage = this.$nuxt.i18n.t('incorrectUsernameOrPassword');
        } else if (error.response.status === 400) {
          errorMessage = this.$nuxt.i18n.t('badRequest');
        }

        snackbar.push(errorMessage, 'error');
      }
    },
    /**
     * Logs out the user from the server using the current base url and access token parameters.
     * @param clearUser - Removes the user from the store
     */
    async logoutUser(clearUser = true, skipRequest = false): Promise<void> {
      try {
        if (!skipRequest) {
          await this.$nuxt.$api.session.reportSessionEnded();
        }
      } finally {
        if (clearUser === true) {
          const currentUser = this.currentUser;
          if (currentUser) {
            Vue.delete(this.accessTokens, currentUser.Id as string);
            this.users = this.users.filter((user) => user === this.currentUser);
            this.currentUserIndex = -1;
          }
        }
      }
    },
    /**
     * Logs out all the user sessions from the provided server and removes it from the store
     */
    async deleteServer(serverUrl: string): Promise<void> {
      const server = this.servers.find(
        (server) => server.PublicAddress === serverUrl
      );

      if (!server) {
        throw new Error("This server doesn't exist in the store");
      }

      const users = this.getUsersFromServer(server);

      if (users) {
        /**
         * We set the baseUrl to the one of the server to log out users of that server properly
         */
        this.$nuxt.$axios.setBaseURL(server.PublicAddress);
        for (const user of users) {
          this.setAxiosHeader(this.getUserAccessToken(user));
          await this.logoutUser(false);
          Vue.delete(this.accessTokens, user.Id as string);
        }

        if (this.currentServer?.PublicAddress) {
          this.$nuxt.$axios.setBaseURL(this.currentServer?.PublicAddress);
          this.setAxiosHeader();
        }

        this.users = this.users.filter((user) => users.includes(user));
      }

      this.servers = this.servers.splice(this.servers.indexOf(server), 1);
    },
    /**
     * Sets the header so the server can handle our requests. By default, it sets the request to the current logged user.
     *
     * @param accessToken - Override the current user's accessToken with the provided value in this parameter
     */
    setAxiosHeader(accessToken?: string): void {
      const deviceProfile = deviceProfileStore();
      if (!accessToken) {
        accessToken = this.getUserAccessToken(this.currentUser) || '';
      }

      if (
        !deviceProfile.clientName ||
        !deviceProfile.clientVersion ||
        !deviceProfile.deviceId ||
        !deviceProfile.deviceName
      ) {
        deviceProfile.setDeviceProfile();
      }

      const token = `MediaBrowser Client="${deviceProfile.clientName}", Device="${deviceProfile.deviceName}", DeviceId="${deviceProfile.deviceId}", Version="${deviceProfile.clientVersion}", Token="${accessToken}"`;

      this.$nuxt.$axios.setHeader('X-Emby-Authorization', token);
    }
  },
  getters: {
    currentServer(): ServerInfo | undefined {
      return this.servers[this.currentServerIndex];
    },
    currentUser(): UserDto | undefined {
      return this.users[this.currentUserIndex];
    },
    currentUserId(): string {
      if (!this.currentUser?.Id) {
        throw new Error('There is no user logged in or the data is malformed');
      }

      return this.currentUser.Id;
    },
    getCurrentUserAccessToken(): string | undefined {
      return this.getUserAccessToken(this.currentUser);
    },
    getServerById: (state) => {
      return (serverId: string | undefined | null): ServerInfo | undefined => {
        return state.servers.find((server) => server.Id === serverId);
      };
    },
    getUserAccessToken: (state) => {
      return (user: UserDto | undefined): string | undefined => {
        if (user?.Id) {
          return state.accessTokens[user.Id];
        }
      };
    },
    getUsersFromServer: (state) => {
      return (server: ServerInfo | undefined): UserDto[] | undefined => {
        return state.users.filter((user) => user.ServerId === server?.Id);
      };
    }
  }
});
