import {
  API_VERSION,
  VersionOutdatedIssue,
  VersionUnsupportedIssue
} from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useStorage } from '@vueuse/core';
import { merge } from 'lodash-es';
import SDK, { useOneTimeAPI } from '../sdk/sdk-utils';
import type { AuthState, ServerInfo } from './types';
import { isAxiosError, isNil } from '@/utils/validation';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { i18n } from '@/plugins/i18n';
import { useSnackbar } from '@/composables/use-snackbar';

class RemotePluginAuth {
  /**
   * == STATE ==
   */
  private _state = useStorage<AuthState>(
    'auth',
    {
      servers: [],
      currentServerIndex: -1,
      currentUserIndex: -1,
      users: [],
      rememberMe: true,
      accessTokens: {}
    },
    localStorage,
    {
      mergeDefaults: (storageValue, defaults) =>
        mergeExcludingUnknown(storageValue, defaults)
    }
  );
  /**
   * Getters
   */
  public get servers(): ServerInfo[] {
    return this._state.value.servers;
  }

  public get currentServer(): ServerInfo | undefined {
    return this._state.value.servers[this._state.value.currentServerIndex];
  }

  public get currentUser(): UserDto | undefined {
    return this._state.value.users[this._state.value.currentUserIndex];
  }

  public get currentUserId(): string | undefined {
    return this.currentUser?.Id;
  }

  public get currentUserToken(): string | undefined {
    return this.getUserAccessToken(this.currentUser);
  }

  public readonly getUserAccessToken = (
    user: UserDto | undefined
  ): string | undefined => {
    return user?.Id ? this._state.value.accessTokens[user.Id] : undefined;
  };

  public readonly getServerById = (
    serverId: string | undefined | null
  ): ServerInfo | undefined => {
    return this._state.value.servers.find((server) => server.Id === serverId);
  };

  public readonly getUsersFromServer = (
    server: ServerInfo | undefined
  ): UserDto[] | undefined => {
    return this._state.value.users.filter(
      (user) => user.ServerId === server?.Id
    );
  };

  /**
   * == METHODS ==
   */
  /**
   * Adds or refresh the information of a server
   *
   * @param server - Payload of the
   * @returns - Index of the server
   */
  private _addOrRefreshServer(server: ServerInfo): number {
    const oldServer = this.getServerById(server.Id);

    if (isNil(oldServer)) {
      this._state.value.servers.push(server);

      return this.servers.indexOf(this.getServerById(server.Id) as ServerInfo);
    } else {
      const servIndex = this.servers.indexOf(oldServer);

      this.servers[servIndex] = merge(oldServer, server);

      return servIndex;
    }
  }
  /**
   * Connects to a server
   *
   * @param serverUrl
   * @param isDefault
   */
  public async connectServer(
    serverUrl: string,
    isDefault = false
  ): Promise<void> {
    const { t } = i18n;

    serverUrl = serverUrl.replace(/\/$/, '').trim();

    const candidates = await SDK.discovery.getRecommendedServerCandidates(
      serverUrl
    );
    const best = SDK.discovery.findBestServer(candidates);

    if (best) {
      const issues = candidates.flatMap((s) => s.issues);

      if (
        issues.some(
          (i) =>
            i instanceof VersionOutdatedIssue ||
            i instanceof VersionUnsupportedIssue
        )
      ) {
        useSnackbar(
          t('serverVersionTooLow', { version: API_VERSION }),
          'error'
        );
        throw new Error(`Server version needs to be at least ${API_VERSION}`);
      }

      try {
        const api = useOneTimeAPI(best.address);
        const { data } = await getSystemApi(api).getPublicSystemInfo();

        delete data.LocalAddress;

        const serv = {
          ...data,
          PublicAddress: best.address,
          isDefault: isDefault
        };

        this._state.value.currentServerIndex = this._addOrRefreshServer(serv);
      } catch (error) {
        useSnackbar(t('anErrorHappened'), 'error');
        console.error(error);
        throw error;
      }
    } else {
      useSnackbar(t('serverNotFound'), 'error');
    }
  }

  /**
   * Logs the user to the current server
   *
   * @param username
   * @param password
   * @param rememberMe
   */
  public async loginUser(
    username: string,
    password: string,
    rememberMe = true
  ): Promise<void> {
    if (!this.currentServer) {
      throw new Error('There is no server in use');
    }

    try {
      const { data } = await useOneTimeAPI(
        this.currentServer.PublicAddress
      ).authenticateUserByName(username, password);

      this._state.value.rememberMe = rememberMe;

      if (data.User?.Id && data.AccessToken) {
        this._state.value.accessTokens[data.User.Id] = data.AccessToken;

        this._state.value.users.push(data.User);
        this._state.value.currentUserIndex = this._state.value.users.indexOf(
          data.User
        );
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const { t } = i18n;
        let errorMessage = t('unexpectedError');

        if (!error.response) {
          errorMessage = error.message || t('serverNotFound');
        } else if (
          error.response.status === 500 ||
          error.response.status === 401
        ) {
          errorMessage = t('incorrectUsernameOrPassword');
        } else if (error.response.status === 400) {
          errorMessage = t('badRequest');
        }

        useSnackbar(errorMessage, 'error');
        throw error;
      }
    }
  }

  /**
   * Refreshes the current user infos, to fetch a new picture for instance
   */
  public async refreshCurrentUserInfo(): Promise<void> {
    if (!isNil(this.currentUser) && !isNil(this.currentServer)) {
      const api = useOneTimeAPI(
        this.currentServer.PublicAddress,
        this.getUserAccessToken(this.currentUser)
      );

      this._state.value.users[this._state.value.currentUserIndex] = (
        await getUserApi(api).getCurrentUser()
      ).data;
    }
  }

  /**
   * Logs out the user from the server using the current base url and access token parameters.
   *
   * @param skipRequest - Skips the request and directly removes the user from the store
   */
  public async logoutCurrentUser(skipRequest = false): Promise<void> {
    if (!isNil(this.currentUser) && !isNil(this.currentServer)) {
      await this.logoutUser(this.currentUser, this.currentServer, skipRequest);

      this._state.value.currentUserIndex = -1;
    }
  }

  /**
   * Logs out an user from its server
   *
   * @param user
   * @param server
   * @param skipRequest
   */
  public async logoutUser(
    user: UserDto,
    server: ServerInfo,
    skipRequest = false
  ): Promise<void> {
    try {
      if (!skipRequest) {
        await useOneTimeAPI(
          server.PublicAddress,
          this.getUserAccessToken(user)
        ).logout();
      }
    } catch (error) {
      console.error(error);
    }

    const storeUser = this._state.value.users.find((u) => u.Id === user.Id);

    if (!isNil(storeUser)) {
      this._state.value.users.splice(
        this._state.value.users.indexOf(storeUser),
        1
      );
    }

    if (!isNil(user.Id)) {
      delete this._state.value.accessTokens[user.Id];
    }
  }

  /**
   * Logs out all the user sessions from the provided server and removes it from the store
   *
   * @param serverUrl
   */
  public async deleteServer(serverUrl: string): Promise<void> {
    const server = this._state.value.servers.find(
      (s) => s.PublicAddress === serverUrl
    );

    if (!server) {
      throw new Error("This server doesn't exist in the store");
    }

    const users = this.getUsersFromServer(server);

    if (users) {
      for (const user of users) {
        await this.logoutUser(user, server);
      }
    }

    this._state.value.servers.splice(
      this._state.value.servers.indexOf(server),
      1
    );
  }

  public constructor() {
    window.setTimeout(async () => await this.refreshCurrentUserInfo());
  }
}

const RemotePluginAuthInstance = new RemotePluginAuth();

export default RemotePluginAuthInstance;
