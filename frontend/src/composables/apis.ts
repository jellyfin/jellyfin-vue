import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosResponse } from 'axios';
import { deepEqual } from 'fast-equals';
import { computed, effectScope, getCurrentScope, inject, isRef, shallowRef, toValue, unref, watch, type ComputedRef, type Ref } from 'vue';
import { until, whenever } from '@vueuse/core';
import type { Exact, Writable } from 'type-fest';
import { isArray, isNil } from '@jellyfin-vue/shared/validation';
import { useLoading } from '#/composables/use-loading';
import { useSnackbar } from '#/composables/use-snackbar';
import { i18n } from '#/plugins/i18n';
import { remote } from '#/plugins/remote';
import { isConnectedToServer } from '#/store';
import { apiStore } from '#/store/api';
import { JView_isRouting } from '#/store/keys';

/* eslint-disable @typescript-eslint/no-explicit-any */
type OmittedKeys = 'fields' | 'userId' | 'enableImages' | 'enableTotalRecordCount' | 'enableImageTypes';
type ParametersAsGetters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any
  ? { [K in keyof P]: () => BetterOmit<Writable<P[K]>, OmittedKeys> }
  : never;
type ExtractResponseDataType<T> = Awaited<T> extends AxiosResponse<infer U> ? U : undefined;
type ComposableParams<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>> =
  Exact<ParametersAsGetters<T[K]>, U>;
/**
 * If the response contains an Items (usually the *QueryResult ones) property, we return the value of Items instead of the whole response,
 * so we return the appropiate type for it. We also remove null and undefined since we already check for that
 * in the runtime logic.
 */
type ExtractItems<T> = T extends { Items?: infer U } ? U extends (infer V)[] ? NonNullable<V>[] : never : T;

/**
 * If response.data is BaseItemDto or BaseItemDto[], returns it. Otherwise, returns undefined.
 */
type ExtractBaseItemDtoResponse<T> =
  (ExtractResponseDataType<T> extends BaseItemDto ? BaseItemDto :
      (ExtractResponseDataType<T> extends BaseItemDtoQueryResult ? BaseItemDto[] :
        ExtractResponseDataType<T> extends BaseItemDto[] ? BaseItemDto[] : undefined));
/**
 * If response.data is BaseItemDto or BaseItemDto[], returns undefined. Otherwise, returns the data type.
 */
type ExtractResponseType<T> =
  (ExtractResponseDataType<T> extends BaseItemDto ? undefined :
      (ExtractResponseDataType<T> extends BaseItemDtoQueryResult ? undefined :
        ExtractItems<ExtractResponseDataType<T>>));

type ReturnData<T extends Record<K, (...args: any[]) => any>, K extends keyof T, J extends boolean> =
  J extends true ? ExtractBaseItemDtoResponse<ReturnType<T[K]>> : ExtractResponseType<ReturnType<T[K]>>;

type MaybeReadonlyRef<T> = T | Ref<T> | ComputedRef<T>;

interface ReturnPayload<T extends Record<K, (...args: any[]) => any>, K extends keyof T, J extends boolean> {
  loading: Ref<boolean | undefined>;
  data: ComputedRef<ReturnData<T, K, J>>;
}

interface OfflineParams<T extends Record<K, (...args: any[]) => any>, K extends keyof T> {
  api: ((api: Api) => T);
  methodName: K;
  args: Parameters<T[K]>;
}

interface SkipCacheOps {
  baseItem?: boolean;
  request?: boolean;
}

interface ComposableOps {
  globalLoading?: boolean;
  skipCache?: SkipCacheOps;
}

type BaseItemComposableOps = ComposableOps & BetterOmit<SkipCacheOps, 'baseItem'>;

const defaultOps: BaseItemComposableOps = Object.freeze({
  globalLoading: true,
  skipCache: {
    baseItem: false,
    request: false
  }
});

/**
 * Sets the state to loading and starts the global loading indicator
 * @param loading - Ref to hold the loading state
 * @param global - Whether to start the global loading indicator or not
 */
function startLoading(loading: Ref<boolean | undefined> | undefined, global: boolean): void {
  if (!isNil(loading)) {
    loading.value = true;

    if (global) {
      useLoading().start();
    }
  }
}

/**
 * Sets the state to finish and ends the global loading indicator
 * @param loading - Ref to hold the loading state
 * @param global - Whether to start the global loading indicator or not
 */
function stopLoading(loading: Ref<boolean | undefined> | undefined, global: boolean): void {
  if (!isNil(loading)) {
    loading.value = false;

    if (global) {
      useLoading().finish();
    }
  }
}

/**
 * Perfoms the given request and updates the store accordingly
 *
 * @param api - Relevant API
 * @param methodName - Method to execute
 * @param ofBaseItem - Whether the request is BaseItemDto based or not
 * @param loading - Ref to hold the loading state
 * @param args - Func args
 */
async function resolveAndAdd<T extends Record<K, (...args: any[]) => any>, K extends keyof T>(
  api: (api: Api) => T,
  methodName: K,
  ofBaseItem: boolean,
  loading: Ref<boolean | undefined> | undefined,
  stringifiedArgs: string,
  ops: Required<ComposableOps>,
  ...args: Parameters<T[K]>): Promise<ExtractItems<Awaited<ReturnType<T[K]>['data']>> | undefined> {
  /**
   * We add all BaseItemDto's fields for consistency in what we can expect from the store.
   * toValue normalizes the getters.
   */
  const extendedParams = [
    {
      ...args[0],
      ...(remote.auth.currentUserId.value && { userId: remote.auth.currentUserId.value }),
      fields: apiStore.apiEnums.fields,
      enableUserData: true,
      enableImageTypes: apiStore.apiEnums.images,
      enableImages: true,
      enableTotalRecordCount: false
    },
    ...args.slice(1)
  ] as Parameters<T[K]>;

  try {
    startLoading(loading, ops.globalLoading);

    const funcName = `${api.name}.${String(methodName)}`;
    const response = await remote.sdk.newUserApi(api)[methodName](...extendedParams) as Awaited<ReturnType<T[K]>>;

    if (response.data) {
      const requestData = response.data as Awaited<ReturnType<T[K]>['data']>;
      const result: ExtractItems<typeof requestData> = 'Items' in requestData && isArray(requestData.Items) ? requestData.Items : requestData;

      if (ofBaseItem && !ops.skipCache.baseItem) {
        apiStore.baseItemAdd(result as BaseItemDto | BaseItemDto[]);
      }

      if (ops.skipCache.request) {
        return result;
      } else {
        apiStore.requestAdd(funcName, stringifiedArgs, ofBaseItem, result);
      }
    }
  } catch {
    if (!isNil(loading)) {
      loading.value = undefined;
    }
  } finally {
    stopLoading(loading, ops.globalLoading);
  }
}

/**
 * This is the internal logic of the composables
 */
function _sharedInternalLogic<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  ofBaseItem: boolean,
  api: MaybeReadonlyRef<((api: Api) => T) | undefined>,
  methodName: MaybeReadonlyRef<K | undefined>,
  ops: Required<ComposableOps>
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, typeof ofBaseItem>> | ReturnPayload<T, K, typeof ofBaseItem> {
  const offlineParams: OfflineParams<T, K>[] = [];
  const isFuncDefined = (): boolean => !isNil(unref(api)) && !isNil(unref(methodName));

  const loading = shallowRef<boolean | undefined>(false);
  const argsRef = shallowRef<Parameters<T[K]>>();
  const result = shallowRef<ReturnData<T, K, typeof ofBaseItem>>();

  const stringArgs = computed(() => {
    return JSON.stringify(argsRef.value);
  });

  /**
   * TODO: Check why previous returns unknown by default without the type annotation
   */
  const cachedData = computed<ReturnType<typeof apiStore.getCachedRequest> | undefined>((previous) => {
    const currentCachedRequest = apiStore.getCachedRequest(`${String(unref(api)?.name)}.${String(unref(methodName))}`, stringArgs.value);

    if ((loading.value || isNil(loading.value)) && !currentCachedRequest) {
      return previous;
    }

    return currentCachedRequest;
  });
  const isCached = computed(() => !!cachedData.value);
  const data = computed<ReturnData<T, K, typeof ofBaseItem>>(() => {
    if (ops.skipCache.request && result.value) {
      if (ofBaseItem) {
        return isArray(result.value)
          ? apiStore.getItemsById((result.value as BaseItemDto[]).map(r => r.Id)) as ReturnData<T, K, typeof ofBaseItem>
          : apiStore.getItemById((result.value as BaseItemDto).Id) as ReturnData<T, K, typeof ofBaseItem>;
      } else {
        return result.value;
      }
    } else {
      return apiStore.getRequest(cachedData.value) as ReturnData<T, K, typeof ofBaseItem>;
    }
  });

  /**
   * Function invoked per every data change.
   * @param onlyPending - Whether to run only pending requests or not
   */
  const run = async ({ onlyPending = false, isRefresh = false }): Promise<void> => {
    const unrefApi = unref(api);
    const unrefMethod = unref(methodName);

    if (!unrefApi || !unrefMethod) {
      return;
    }

    /**
     * Rerun previous parameters when the user is back online
     */
    if (offlineParams.length) {
      await Promise.all(offlineParams.map(p => void resolveAndAdd(p.api, p.methodName, ofBaseItem, loading, stringArgs.value, ops, ...p.args)));
      offlineParams.length = 0;
    }

    if (argsRef.value && !onlyPending) {
      try {
        if (isConnectedToServer.value) {
          const resolved = await resolveAndAdd(unrefApi, unrefMethod, ofBaseItem, isRefresh ? undefined : loading, stringArgs.value, ops, ...argsRef.value);

          result.value = resolved as ReturnData<T, K, typeof ofBaseItem>;
        } else {
          useSnackbar(i18n.t('offlineCantDoThisWillRetryWhenOnline'), 'error');

          offlineParams.push({
            api: unrefApi,
            methodName: unrefMethod,
            args: argsRef.value
          });
        }
      } catch {}
    }
  };

  return function (this: any, ...args: ComposableParams<T, K, U>) {
    const normalizeArgs = (): Parameters<T[K]> => args.map(a => toValue(a)) as Parameters<T[K]>;
    const runNormally = async (): Promise<void> => {
      await run({});
    };
    const runWithRetry = async (): Promise<void> => {
      await run({ onlyPending: true });
    };
    const returnablePromise = async (): Promise<ReturnPayload<T, K, typeof ofBaseItem>> => {
      await runNormally();
      await until(() => isCached.value && !ops.skipCache.request).toBeTruthy({ flush: 'pre' });

      return { loading, data };
    };

    argsRef.value = normalizeArgs();

    if (!isNil(getCurrentScope())) {
      const handleArgsChange = async (_: typeof args, old: typeof args | undefined): Promise<void> => {
        const normalizedArgs = normalizeArgs();

        /**
         * Does a deep comparison to avoid useless double requests
         */
        if (old && !normalizedArgs.every((a, index) => deepEqual(a, toValue(old[index])))) {
          argsRef.value = normalizedArgs;
          await runNormally();
        }
      };
      const scope = effectScope();

      scope.run(() => {
        if (args.length) {
          watch(args, handleArgsChange);
        }

        watch(isConnectedToServer, runWithRetry);

        if (isRef(api)) {
          watch(api, runNormally);
        }

        if (isRef(methodName)) {
          watch(methodName, runNormally);
        }
      });

      /**
       * If we're routing, the effects of this composable are no longer useful, so we stop them
       * to avoid accidental data fetching (e.g due to route param changes)
       */
      const isRouting = inject(JView_isRouting);

      if (!isNil(isRouting)) {
        whenever(isRouting, () => scope.stop(),
          { once: true, flush: 'sync' }
        );
      }
    }

    /**
     * If there's available data before component mount, we return the cached data rightaway (see below how
     * we skip the promise) to get the component mounted as soon as possible.
     * However, we queue a request to the server to update the data after the component is
     * mounted. setTimeout executes it when the event loop is clear, avoiding overwhelming the engine.
     */
    if (isCached.value) {
      void run({ isRefresh: true });
    } else if (isFuncDefined()) {
      /**
       * Wait for the cache to be populated before resolving the promise
       * If the promise never resolves (and the component never gets mounted),
       * the problem is that there is an issue in your logic, not in this composable.
       */
      return returnablePromise();
    }

    return { loading, data };
  };
}

/**
 * Reactively performs item requests to the API:
 *
 * - When the parameters of the request changes, the request is performed again and the ComputedRef returns updated data
 * - Caches the request response in the apiStore
 * - If there's already cached data in the store for the given parameters, a request to the
 * server it's still performed to refresh, but the Promise will be resolved
 * immediately and the ComputedRef will return the cached data first.
 * - If the request is made when the connection to the server was lost, the request and their params are queued and executed when the connection is back.
 *
 * This composable also returns a promise, so it prevents rendering the component with Suspense until the initial request is done
 * (ensuring this way the data is always available before mount).
 * See [Vue docs](https://vuejs.org/guide/built-ins/suspense.html#suspense) for more information.
 *
 * Here's an usage example. **Request parameters must be passed as getters (like props on watchers)**:
 *
 * ```ts
 * const { loading, data: item } = await useBaseItem(getUserLibraryApi, 'getItem')(() => {
 *   ...the request parameters
 * });
 * ```
 *
 * Caveats:
 * - If not used inside a component's script setup area (or in any Vue's effectScope), changing parameters will not be reactive.
 * This is done in order to avoid memory leaks.
 * - It only works with requests that return BaseItemDto or BaseItemDtoQueryResult responses. If you need to use another type, you **must**
 * use the `useApi` composable.
 * - **BE CAREFUL**: Since the type of the ComputedRef's of data is always the request's response,
 * if no succesful response data is available at any point, the promise will never resolve to ensure at runtime the expected data is available.
 * This means that the component might never mount if you use it to fetch the initial page data.
 * This forces you to have the correct logic and successful responses in normal conditions.
 * If the user has lost the internet connection, for example, it won't be redirected to the new page's component,
 * since it will never mount, and that's what we want! (so the user can only navigate data he has already acquired).
 * This will not happen if either ``api`` or ``methodName`` are set undefined, so
 * you can use that composable invokation after mount (like in LikeButton component).
 *
 * Don't worry, TypeScript will tell you that `data` is always undefined when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @param ops.globalLoading - Show the global loading indicator or not for this request. Defaults to true.
 * This parameter is ignored if the request is already cached and it's being refreshed (no loading indicator is shown in that case).
 * @param ops.skipCache.request - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Whether to skip the cache or not. Useful for requests whose return value are known to be useless to cache,
 * like marking an item as played or favorite. Defaults to false.
 * @returns data  - The BaseItemDto or BaseItemDto[] that was requested.
 * @returns loading - A boolean ref that indicates if the request is in progress. Undefined if there was an error
 */
export function useBaseItem<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeReadonlyRef<((api: Api) => T) | undefined>,
  methodName: MaybeReadonlyRef<K | undefined>,
  ops?: BaseItemComposableOps
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, true>> | ReturnPayload<T, K, true> {
  return _sharedInternalLogic<T, K, U>(true, api, methodName, (ops ? { ...ops, ...defaultOps } : defaultOps) as Required<ComposableOps>);
}

/**
 * Reactively performs requests to the API:
 *
 * - When the parameters of the request changes, the request is performed again and the ComputedRef returns updated data.
 * - Caches the request response in the apiStore
 * - If there's already cached data in the store for the given parameters, a request to the
 * server it's still performed to refresh, but the Promise will be resolved
 * immediately and the ComputedRef will return the cached data first.
 * - If the request is made when the connection to the server was lost, the request and their params are queued and executed when the connection is back.
 *
 * This composable also returns a promise, so it prevents rendering the component with Suspense until the initial request is done
 * (ensuring this way the data is always available before mount).
 * See [Vue docs](https://vuejs.org/guide/built-ins/suspense.html#suspense) for more information.
 *
 * Here's an usage example. **Request parameters must be passed as getters (like props on watchers)**.:
 *
 * ```ts
 * const { loading, data: item } = await useApi(getItemUpdateApi, 'updateItemContentType')(() => {
 *   ...the request parameters
 * });
 * ```
 *
 * Caveats:
 * - If not used inside a component's script setup area (or in any Vue's effectScope), changing parameters will not be reactive.
 * This is done in order to avoid memory leaks.
 * - It only works with requests that doesn't return BaseItemDto or BaseItemDtoQueryResult responses. If the return result
 * of your request is any of those types, you **must** use the `useBaseItem` composable.
 * - **BE CAREFUL**: Since the type of the ComputedRef's of data is always the request's response,
 * if no succesful response data is available at any point (**and skipCache = false**),
 * the promise will never resolve to ensure at runtime the expected data is available.
 * This means that the component might never mount if you use it to fetch the initial page data.
 * This forces you to have the correct logic and successful responses in normal conditions.
 * If the user has lost the internet connection, for example, it won't be redirected to the new page's component,
 * since it will never mount, and that's what we want! (so the user can only navigate data he has already acquired).
 * This will not happen if either ``api`` or ``methodName`` are set undefined, so
 * you can use that composable invokation after mount (like in LikeButton component).
 *
 * Don't worry, TypeScript will tell you that `data` is always undefined when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @param ops - Composable options
 * @param ops.skipCache.request - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Whether to skip the cache or not. Useful for requests whose return value are known to be useless to cache,
 * like marking an item as played or favorite. Defaults to false.
 * @param ops.skipCache.baseItem - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Same as above, but also for baseItems. Defaults to false.
 * @param ops.globalLoading - Show the global loading indicator or not for this request. Defaults to true.
 * This parameter is ignored if the request is already cached and it's being refreshed (no loading indicator is shown in that case).
 * @returns data  - The request data.
 * @returns loading - A boolean ref that indicates if the request is in progress. Undefined if there was an error
 */
export function useApi<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeReadonlyRef<((api: Api) => T) | undefined>,
  methodName: MaybeReadonlyRef<K | undefined>,
  ops?: ComposableOps
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, false>> | ReturnPayload<T, K, false> {
  return _sharedInternalLogic<T, K, U>(false, api, methodName, (ops ? { ...ops, ...defaultOps } : defaultOps) as Required<ComposableOps>);
}

/**
 * This is an special function to get an object with the appropiate parameters to use in the `useApi` or `useBaseItem` composables.
 * See example of usage in pages/library/[itemId].vue.
 */
export function methodsAsObject<T extends Record<K, (...args: any[]) => any>, K extends keyof T>(
  api: (api: Api) => T,
  methodName: K
): { api: (api: Api) => T; methodName: K } {
  return {
    api,
    methodName
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
