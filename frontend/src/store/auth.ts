import Vue from 'vue';
import { PublicSystemInfo, UserDto } from '@jellyfin/client-axios';
import { defineStore } from 'pinia';
import { AxiosError } from 'axios';
import isNil from 'lodash/isNil';
import { deviceProfileStore, snackbarStore, socketStore } from '.';

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
     *
     * @param serverUrl
     * @param isDefault
     */
    async connectServer(serverUrl: string, isDefault = false) {
      serverUrl = serverUrl.replace(/\/$/, '');

      const snackbar = snackbarStore();

      this.$nuxt.$axios.defaults.baseURL = serverUrl;
      this.setAxiosHeader();

      let data: ServerInfo;

      try {
        data = (await this.$nuxt.$api.system.getPublicSystemInfo())
          .data as ServerInfo;
        data.PublicAddress = serverUrl;
        data.isDefault = isDefault;
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
     *
     * @param username
     * @param password
     * @param rememberMe
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
            authenticateResponse.User.Id,
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
        /**
         * Pass the error up, so it's handled successfully in the action's subscriptions
         */
        throw err;
      }
    },
    /**
     * Logs out the user from the server using the current base url and access token parameters.
     *
     * @param skipRequest - Skips the request and directly removes the user from the store
     */
    async logoutCurrentUser(skipRequest = false): Promise<void> {
      if (!isNil(this.currentUser) && !isNil(this.currentServer)) {
        await this.logoutUser(
          this.currentUser,
          this.currentServer,
          skipRequest
        );

        this.currentUserIndex = -1;
      }
    },
    /**
     * Logs out an user from the server
     *
     * @param user
     * @param server
     * @param skipRequest
     */
    async logoutUser(
      user: UserDto,
      server: ServerInfo,
      skipRequest = false
    ): Promise<void> {
      try {
        if (!skipRequest) {
          /**
           * We set the baseUrl and the token to the server where we want to log out users
           */
          this.setAxiosBaseUrl(server.PublicAddress);
          this.setAxiosHeader(this.getUserAccessToken(user));
          await this.$nuxt.$api.session.reportSessionEnded();
        }
      } catch {
      } finally {
        const storeUser = this.users.find((u) => u.Id === user.Id);

        if (!isNil(storeUser)) {
          this.users.splice(this.users.indexOf(storeUser), 1);
        }

        Vue.delete(this.accessTokens, user.Id as string);
        this.setAxiosBaseUrl(this.currentServer?.PublicAddress);
        this.setAxiosHeader();
      }
    },
    /**
     * Logs out all the user sessions from the provided server and removes it from the store
     *
     * @param serverUrl
     */
    async deleteServer(serverUrl: string): Promise<void> {
      const server = this.servers.find((s) => s.PublicAddress === serverUrl);

      if (!server) {
        throw new Error("This server doesn't exist in the store");
      }

      const users = this.getUsersFromServer(server);

      if (users) {
        for (const user of users) {
          await this.logoutUser(user, server);
        }
      }

      this.servers.splice(this.servers.indexOf(server), 1);
    },
    /**
     * Sets the Axios baseUrl so we can make request to a server
     */
    setAxiosBaseUrl(serverUrl?: string): void {
      if (isNil(serverUrl) && this.currentServer?.PublicAddress) {
        this.$nuxt.$axios.defaults.baseURL = this.currentServer.PublicAddress;
      } else {
        this.$nuxt.$axios.defaults.baseURL = serverUrl;
      }
    },
    /**
     * Sets the header so the server can handle our requests. By default, it sets the request to the current logged user.
     *
     * @param accessToken - Override the current user's accessToken with the provided value in this parameter
     */
    setAxiosHeader(accessToken?: string): void {
      const deviceProfile = deviceProfileStore();

      if (!accessToken) {
        accessToken = this.currentUserToken;
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

      this.$nuxt.$axios.defaults.headers.common['X-Emby-Authorization'] = token;
    },
    /**
     * Configures the Axios instance with the appropiate baseUrl and token, based on current user and server selection
     * and starts the user websocket
     * Used at app initialization time.
     */
    authInit(): void {
      const socket = socketStore();

      this.setAxiosBaseUrl();
      this.setAxiosHeader();
      socket.connectUserWebSocket();
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
      return this.currentUser?.Id || '';
    },
    currentUserToken(): string {
      return this.getUserAccessToken(this.currentUser) || '';
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
