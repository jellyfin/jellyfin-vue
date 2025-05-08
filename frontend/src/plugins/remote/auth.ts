import {
  API_VERSION,
  VersionOutdatedIssue,
  VersionUnsupportedIssue
} from '@jellyfin/sdk';
import type { UserDto, PublicSystemInfo, BrandingOptions } from '@jellyfin/sdk/lib/generated-client';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed } from 'vue';
import { isAxiosError, isNil, sealed } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import SDK, { useOneTimeAPI } from './sdk/sdk-utils';
import { useSnackbar } from '#/composables/use-snackbar';
import { BaseState } from '#/store/super/base-state';

export interface ServerInfo extends BetterOmit<PublicSystemInfo, 'LocalAddress'> {
  PublicAddress: string;
  isDefault: boolean;
  BrandingOptions: BrandingOptions;
  PublicUsers: UserDto[];
}

interface AuthState {
  servers: ServerInfo[];
  currentServerIndex: number;
  currentUserIndex: number;
  users: UserDto[];
  rememberMe: boolean;
  /**
   * Key: userId. Value: Access token
   */
  accessTokens: Record<string, string>;
}

@sealed
class RemotePluginAuth extends BaseState<AuthState> {
  private readonly _callbacks = {
    beforeLogout: [] as MaybePromise<void>[],
    afterLogout: [] as MaybePromise<void>[]
  };

  public readonly servers = computed(() => this._state.value.servers);
  public readonly currentServer = computed(() => this._state.value.servers[this._state.value.currentServerIndex]);
  public readonly currentUser = computed(() => this._state.value.users[this._state.value.currentUserIndex]);
  public readonly currentUserId = computed(() => this.currentUser.value?.Id);
  public readonly currentUserToken = computed(() => this._getUserAccessToken(this.currentUser.value));
  public readonly addedServers = computed(() => this._state.value.servers.length);

  private readonly _getUserAccessToken = (
    user: UserDto | undefined
  ): string | undefined => {
    return user?.Id ? this._state.value.accessTokens[user.Id] : undefined;
  };

  public readonly getServerById = (
    serverId: string | undefined | null
  ): ServerInfo | undefined => {
    return this._state.value.servers.find(server => server.Id === serverId);
  };

  public readonly getUsersFromServer = (
    server: ServerInfo | undefined
  ): UserDto[] | undefined => {
    return this._state.value.users.filter(
      user => user.ServerId === server?.Id
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
  private readonly _addOrRefreshServer = (server: ServerInfo): number => {
    const oldServer = this.getServerById(server.Id);

    if (isNil(oldServer)) {
      this._state.value.servers.push(server);

      return this._state.value.servers.indexOf(this.getServerById(server.Id)!);
    } else {
      const servIndex = this._state.value.servers.indexOf(oldServer);

      this._state.value.servers[servIndex] = server;

      return servIndex;
    }
  };

  private readonly _fetchServerData = async (address: string, isDefault = false): Promise<ServerInfo> => {
    const api = useOneTimeAPI(address);
    const { data: systemInfo } = await getSystemApi(api).getPublicSystemInfo();
    const { data: BrandingOptions } = await getBrandingApi(api).getBrandingOptions();
    const { data: PublicUsers } = await getUserApi(api).getPublicUsers({});

    delete systemInfo.LocalAddress;

    return {
      ...systemInfo,
      PublicAddress: address,
      isDefault: isDefault,
      BrandingOptions,
      PublicUsers
    };
  };

  private readonly _runCallbacks = async (callbacks: MaybePromise<void>[]) =>
    await Promise.allSettled(callbacks.map(fn => fn()));

  /**
   * Runs the passed function before logging out the user
   */
  public readonly onBeforeLogout = (fn: MaybePromise<void>) =>
    this._callbacks.beforeLogout.push(fn);

  public readonly onAfterLogout = (fn: MaybePromise<void>) =>
    this._callbacks.afterLogout.push(fn);

  /**
   * Connects to a server
   *
   * @param serverUrl
   * @param isDefault
   */
  public readonly connectServer = async (
    serverUrl: string,
    isDefault = false
  ): Promise<void> => {
    const { t } = i18next;

    serverUrl = serverUrl.replace(/\/$/, '').trim();

    const candidates = await SDK.discovery.getRecommendedServerCandidates(
      serverUrl
    );
    const best = SDK.discovery.findBestServer(candidates);

    if (best) {
      const issues = candidates.flatMap(s => s.issues);

      if (
        issues.some(
          i =>
            i instanceof VersionOutdatedIssue
            || i instanceof VersionUnsupportedIssue
        )
      ) {
        useSnackbar(
          t('serverVersionTooLow', { version: API_VERSION }),
          'error'
        );
        throw new Error(`Server version needs to be at least ${API_VERSION}`);
      }

      try {
        const serv = await this._fetchServerData(best.address, isDefault);

        this._state.value.currentServerIndex = this._addOrRefreshServer(serv);
      } catch (error) {
        useSnackbar(t('anErrorHappened'), 'error');
        console.error(error);
        throw error;
      }
    } else {
      useSnackbar(t('serverNotFound'), 'error');
    }
  };

  /**
   * Logs the user to the current server
   *
   * @param username
   * @param password
   * @param rememberMe
   */
  public readonly loginUser = async (
    username: string,
    password: string,
    rememberMe = true
  ): Promise<void> => {
    if (!this.currentServer.value) {
      throw new Error('There is no server in use');
    }

    try {
      const { data } = await useOneTimeAPI(
        this.currentServer.value.PublicAddress
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
          error.response.status === 500
          || error.response.status === 401
        ) {
          errorMessage = t('incorrectUsernameOrPassword');
        } else if (error.response.status === 400) {
          errorMessage = t('badRequest');
        }

        useSnackbar(errorMessage, 'error');
        throw error;
      }
    }
  };

  /**
   * Refreshes the current user infos, to fetch a new picture for instance
   */
  public readonly refreshCurrentUserInfo = async (): Promise<void> => {
    if (!isNil(this.currentUser.value) && !isNil(this.currentServer.value)) {
      const api = useOneTimeAPI(
        this.currentServer.value.PublicAddress,
        this.currentUserToken.value
      );

      this._state.value.users[this._state.value.currentUserIndex] = (
        await getUserApi(api).getCurrentUser()
      ).data;
    }
  };

  private readonly _refreshServers = async (): Promise<void> => {
    for (const server of this._state.value.servers) {
      try {
        const info = await this._fetchServerData(server.PublicAddress, server.isDefault);

        this._addOrRefreshServer(info);
      } catch {}
    }
  };

  /**
   * Logs out the user from the server using the current base url and access token parameters.
   *
   * @param skipRequest - Skips the request and directly removes the user from the store
   */
  public readonly logoutCurrentUser = async (skipRequest = false): Promise<void> => {
    if (!isNil(this.currentUser.value) && !isNil(this.currentServer.value)) {
      await this._runCallbacks(this._callbacks.beforeLogout);
      await this.logoutUser(this.currentUser.value, this.currentServer.value, skipRequest);

      this._state.value.currentUserIndex = -1;
      /**
       * We need this so the callbacks are run after all the dependencies are updated
       * (i.e the page component is routed to index).
       */
      globalThis.requestAnimationFrame(() =>
        globalThis.setTimeout(() => void this._runCallbacks(this._callbacks.afterLogout))
      );
    }
  };

  /**
   * Logs out an user from its server
   *
   * @param user
   * @param server
   * @param skipRequest
   */
  public readonly logoutUser = async (
    user: UserDto,
    server: ServerInfo,
    skipRequest = false
  ): Promise<void> => {
    try {
      if (!skipRequest) {
        await useOneTimeAPI(
          server.PublicAddress,
          this._getUserAccessToken(user)
        ).logout();
      }
    } catch (error) {
      console.error(error);
    }

    const storeUser = this._state.value.users.find(u => u.Id === user.Id);

    if (!isNil(storeUser)) {
      this._state.value.users.splice(
        this._state.value.users.indexOf(storeUser),
        1
      );
    }

    if (!isNil(user.Id)) {
      delete this._state.value.accessTokens[user.Id];
    }
  };

  /**
   * Logs out all the user sessions from the provided server and removes it from the store
   *
   * @param serverUrl
   */
  public readonly deleteServer = async (serverUrl: string): Promise<void> => {
    const server = this._state.value.servers.find(
      s => s.PublicAddress === serverUrl
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

    const serverIndex = this._state.value.servers.indexOf(server);

    this._state.value.servers.splice(
      serverIndex,
      1
    );

    if (this._state.value.currentServerIndex === serverIndex) {
      this._state.value.currentServerIndex = -1;
    }
  };

  public constructor() {
    super({
      storeKey: 'auth',
      defaultState: () => ({
        servers: [],
        currentServerIndex: -1,
        currentUserIndex: -1,
        users: [],
        rememberMe: true,
        accessTokens: {}
      }),
      persistenceType: 'localStorage'
    });

    void this.refreshCurrentUserInfo();
    void this._refreshServers();
  }
}

const RemotePluginAuthInstance = new RemotePluginAuth();

export default RemotePluginAuthInstance;
