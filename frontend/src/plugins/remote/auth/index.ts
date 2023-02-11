import { RemovableRef, useStorage } from '@vueuse/core';
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { isNil, merge } from 'lodash-es';
import { useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import { useOneTimeAPI } from '../sdk/sdk-utils';
import type { AuthState, ServerInfo } from './types';
import { usei18n, useSnackbar } from '@/composables';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

const state: RemovableRef<AuthState> = useStorage(
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
 * TypeScript type guard for AxiosError
 */
function isAxiosError(object: unknown): object is AxiosError {
  return !!(object && typeof object === 'object' && 'isAxiosError' in object);
}

class RemotePluginAuth {
  /**
   * Getters
   */
  public get servers(): ServerInfo[] {
    return state.value.servers;
  }
  public get currentServer(): ServerInfo | undefined {
    return state.value.servers[state.value.currentServerIndex];
  }
  public get currentUser(): UserDto | undefined {
    return state.value.users[state.value.currentUserIndex];
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
    return user?.Id ? state.value.accessTokens[user.Id] : undefined;
  };
  public readonly getServerById = (
    serverId: string | undefined | null
  ): ServerInfo | undefined => {
    return state.value.servers.find((server) => server.Id === serverId);
  };
  public readonly getUsersFromServer = (
    server: ServerInfo | undefined
  ): UserDto[] | undefined => {
    return state.value.users.filter((user) => user.ServerId === server?.Id);
  };

  /**
   * Methods
   */
  /**
   * Adds a new server to the store and sets it as the active server
   *
   * @param serverUrl
   * @param isDefault
   */
  public async connectServer(
    serverUrl: string,
    isDefault = false
  ): Promise<void> {
    const i18n = usei18n();
    const router = useRouter();
    let serv: ServerInfo;

    serverUrl = serverUrl.replace(/\/$/, '').trim();

    try {
      const api = useOneTimeAPI(serverUrl);

      const { data } = await getSystemApi(api).getPublicSystemInfo();

      delete data.LocalAddress;
      serv = {
        ...data,
        PublicAddress: serverUrl,
        isDefault: isDefault
      };
    } catch (error) {
      useSnackbar(i18n.t('login.serverNotFound'), 'error');
      throw error;
    }

    const semverMajor = Number(serv.Version?.split('.')[0]);
    const semverMinor = Number(serv.Version?.split('.')[1]);
    const isServerVersionSupported =
      semverMajor > 10 || (semverMajor === 10 && semverMinor >= 7);

    if (isServerVersionSupported) {
      if (!serv.StartupWizardCompleted) {
        router.push({ path: '/wizard' });
      } else {
        const oldServer = this.getServerById(serv.Id);

        if (!isNil(oldServer)) {
          this.servers[this.servers.indexOf(oldServer)] = merge(
            oldServer,
            serv
          );
        } else {
          state.value.servers.push(serv);
        }

        const serverInfo = state.value.servers.find(
          (serv) => serv.PublicAddress === serverUrl
        );
        if (!serverInfo) {
          throw new Error('expected to find server by url');
        }

        state.value.currentServerIndex =
          state.value.servers.indexOf(serverInfo);
      }
    } else {
      useSnackbar(i18n.t('login.serverVersionTooLow'), 'error');
      throw new Error('Server version is too low');
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
    rememberMe: boolean
  ): Promise<void> {
    if (!this.currentServer) {
      throw new Error('There is no server in use');
    }

    try {
      const { data } = await useOneTimeAPI(
        this.currentServer.PublicAddress
      ).authenticateUserByName(username, password);

      state.value.rememberMe = rememberMe;

      if (data.User?.Id && data.AccessToken) {
        state.value.accessTokens[data.User.Id] = data.AccessToken;

        state.value.users.push(data.User);
        state.value.currentUserIndex = state.value.users.indexOf(data.User);
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const { t } = usei18n();
        let errorMessage = 'unexpectedError';

        if (!error.response) {
          errorMessage = error.message || t('login.serverNotFound');
        } else if (
          error.response.status === 500 ||
          error.response.status === 401
        ) {
          errorMessage = t('incorrectUsernameOrPassword');
        } else if (error.response.status === 400) {
          errorMessage = t('badRequest');
        }

        useSnackbar(errorMessage, 'error');
      }
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

      state.value.currentUserIndex = -1;
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
        useOneTimeAPI(
          server.PublicAddress,
          this.getUserAccessToken(user)
        ).logout();
      }
    } finally {
      const storeUser = state.value.users.find((u) => u.Id === user.Id);

      if (!isNil(storeUser)) {
        state.value.users.splice(state.value.users.indexOf(storeUser), 1);
      }

      if (!user.Id) {
        throw new Error('expected user to have id');
      }

      delete state.value.accessTokens[user.Id];
    }
  }
  /**
   * Logs out all the user sessions from the provided server and removes it from the store
   *
   * @param serverUrl
   */
  public async deleteServer(serverUrl: string): Promise<void> {
    const server = state.value.servers.find(
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

    state.value.servers.splice(state.value.servers.indexOf(server), 1);
  }
}

const RemotePluginAuthInstance = new RemotePluginAuth();

export default RemotePluginAuthInstance;
