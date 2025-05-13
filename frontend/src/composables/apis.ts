import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosResponse } from 'axios';
import { deepEqual } from 'fast-equals';
import {
  computed,
  effectScope,
  getCurrentScope,
  inject,
  isRef,
  shallowRef,
  toValue,
  unref,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type MaybeRef,
  type ShallowRef
} from 'vue';
import { until, watchDeep, whenever } from '@vueuse/core';
import type { IsEqual, Exact, Writable } from 'type-fest';
import { isArray, isFunc, isNil } from '@jellyfin-vue/shared/validation';
import i18next from 'i18next';
import { defu } from 'defu';
import { useLoading } from '#/composables/use-loading';
import { useSnackbar } from '#/composables/use-snackbar';
import { remote } from '#/plugins/remote';
import { isConnectedToServer } from '#/store';
import { apiEnums, apiStore, lastUpdatedIds } from '#/store/dbs/api';
import { JView_isRouting } from '#/store/keys';

/* eslint-disable @typescript-eslint/no-explicit-any */
type OmittedKeys = 'fields' | 'userId' | 'enableImages' | 'enableTotalRecordCount' | 'enableImageTypes';
type ParametersAsGetters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any
  ? { [K in keyof P]: () => BetterOmit<Writable<P[K]>, OmittedKeys> }
  : never;
type ExtractResponseDataType<T> = Awaited<T> extends AxiosResponse<infer U> ? U : never;
type ComposableParams<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>> =
  Exact<ParametersAsGetters<T[K]>, U>;
/**
 * If the response contains an Items (usually the *QueryResult ones) property, we return the value of Items instead of the whole response,
 * so we return the appropiate type for it. We also remove null and undefined since we already check for that
 * in the runtime logic.
 */
type ExtractItems<T> = T extends { Items?: infer U } ? U extends (infer V)[] ? NonNullable<V>[] : never : T;

/**
 * If response.data is BaseItemDto or BaseItemDto[], returns it. Otherwise, returns never.
 */
type ExtractBaseItemDtoResponse<T> =
  IsEqual<ExtractResponseDataType<T>, BaseItemDto> extends true ? BaseItemDto :
    IsEqual<ExtractResponseDataType<T>, BaseItemDtoQueryResult> extends true ? BaseItemDto[] :
      IsEqual<ExtractResponseDataType<T>, BaseItemDto[]> extends true ? BaseItemDto[] :
        never;
/**
 * If response.data is BaseItemDto or BaseItemDto[], returns never. Otherwise, returns the data type.
 */
type ExtractResponseType<T> =
  IsEqual<ExtractResponseDataType<T>, BaseItemDto> extends true ? never :
    IsEqual<ExtractResponseDataType<T>, BaseItemDtoQueryResult> extends true ? never :
      IsEqual<ExtractResponseDataType<T>, BaseItemDto[]> extends true ? never :
        ExtractItems<ExtractResponseDataType<T>>;

type ReturnData<T extends Record<K, (...args: any[]) => any>, K extends keyof T, J extends boolean> =
  J extends true ? ExtractBaseItemDtoResponse<ReturnType<T[K]>> : ExtractResponseType<ReturnType<T[K]>>;

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

const defaultOps: () => BaseItemComposableOps = () => ({
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
  }

  if (global) {
    useLoading().start();
  }
}

/**
 * Sets the state to finish and ends the global loading indicator
 * @param loading - Ref to hold the loading state
 * @param global - Whether to start the global loading indicator or not
 */
function stopLoading(loading: Ref<boolean | undefined> | undefined, global: boolean): void {
  if (!isNil(loading?.value)) {
    loading.value = false;
  }

  if (global) {
    useLoading().finish();
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
async function fetchAndAdd<T extends Record<K, (...args: any[]) => any>, K extends keyof T>(
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
      fields: apiEnums.fields,
      enableUserData: true,
      enableImageTypes: apiEnums.images,
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
        await apiStore.baseItemAdd(result as BaseItemDto | BaseItemDto[]);
      }

      return ops.skipCache.request
        ? result
        : (await apiStore.requestAdd(funcName, stringifiedArgs, ofBaseItem, result)) as
          ExtractItems<Awaited<ReturnType<T[K]>['data']>>;
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
 * Ensures that the last promise execution is the only
 * one that applies the value to the passed ref
 */
function cancellableWrapper<T, F extends (...args: any[]) => Promise<any>>(
  ref: ShallowRef<T>,
  task: F
): (...args: Parameters<F>) => Promise<void> {
  let counter = 0;

  return async (...args: Parameters<F>): Promise<void> => {
    counter++;

    const counterAtBeginning = counter;
    const result = await task(...args);

    if (counter === counterAtBeginning) {
      ref.value = result as T;
    }
  };
}

/**
 * Gets a closure holding the state of the cached ApiResponse
 *
 * Check {@link #/store/dbs/api/api-response:ApiResponse | ApiResponse} for more details
 * about the storage layer.
 */
function getRequestClosure<T extends Record<K, (...args: any[]) => any>, K extends keyof T>(
  rawParams: () => {
    raw_api: ((api: Api) => T) | undefined;
    raw_method: K | undefined;
  },
  argsRef: ComputedRef<string>
) {
  return (() => {
    const ref = shallowRef<Awaited<ReturnType<typeof apiStore['getCachedRequest']>>>();

    return {
      ref,
      trigger: cancellableWrapper(ref, async () => {
        const { raw_api, raw_method } = rawParams();

        return await apiStore.getCachedRequest(
          `${String(raw_api?.name)}.${String(raw_method)}`,
          argsRef.value
        );
      })
    };
  })();
}

/**
 * Gets a closure holding the state of the cached Item
 *
 * Check {@link #/store/dbs/api/item:Item | Item} for more details
 * about the storage layer.
 */
function getItemClosure<T extends Record<K, (...args: any[]) => any>, K extends keyof T>() {
  return (() => {
    const ref = shallowRef<Awaited<ReturnType<typeof apiStore['getCachedRequest']>>>();

    return {
      ref,
      trigger: cancellableWrapper(ref, async (fetchResult: ReturnData<T, K, true>) => {
        return isArray(fetchResult)
          ? await apiStore.getItemsById((fetchResult).map(r => r.Id))
          : await apiStore.getItemById((fetchResult as Nullish<BaseItemDto>)?.Id);
      })
    };
  })();
}

/**
 * When the composable is used inside a component or effect scope, we need to setup the effects.
 * This is skipped if the composable is used outside of a component or effect scope.
 */
function setupEffects<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  { args, argsRef, api, methodName, ofBaseItem, normalizeArgs, runNormally, refreshBaseItem, runWithRetry }: {
    args: ComposableParams<T, K, U>;
    argsRef: ShallowRef<Parameters<T[K]> | undefined>;
    api: MaybeRef<((api: Api) => T) | undefined>;
    methodName: MaybeRefOrGetter<K | undefined>;
    ofBaseItem: boolean;
    runNormally: () => Promise<void>;
    runWithRetry: () => Promise<void>;
    refreshBaseItem: () => void;
    normalizeArgs: () => Parameters<T[K]>;
  }
) {
  const scope = effectScope();

  scope.run(() => {
    if (args.length) {
      watchDeep(args, async (_, old) => {
        const normalizedArgs = normalizeArgs();

        /**
         * Does a deep comparison to avoid useless double requests
         */
        if (!normalizedArgs.every((a, index) => deepEqual(a, toValue(old[index])))) {
          argsRef.value = normalizedArgs;
          await runNormally();
        }
      });
    }

    watch(isConnectedToServer, runWithRetry);

    if (ofBaseItem) {
      watch(lastUpdatedIds, refreshBaseItem, { flush: 'sync' });
    }

    if (isRef(api)) {
      watch(api, runNormally);
    }

    if (isRef(methodName) || isFunc(methodName)) {
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
 * This is the internal logic of the composables
 */
function _sharedInternalLogic<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  ofBaseItem: boolean,
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRefOrGetter<K | undefined>,
  ops: Required<ComposableOps>
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, typeof ofBaseItem>> {
  const hasEffects = !!getCurrentScope();
  const offlineParams: OfflineParams<T, K>[] = [];
  const rawParams = () => ({ raw_api: unref(api), raw_method: toValue(methodName) });
  const isFuncDefined = () => {
    const { raw_api, raw_method } = rawParams();

    return !isNil(raw_api) && !isNil(toValue(raw_method));
  };

  const loading = shallowRef<boolean | undefined>(false);
  const argsRef = shallowRef<Parameters<T[K]>>();
  const stringArgs = computed(() => {
    return JSON.stringify(argsRef.value ?? []);
  });

  const cachedRequest = ops.skipCache.request
    ? undefined
    : getRequestClosure<T, K>(rawParams, stringArgs);
  const cachedItems = ops.skipCache.request && !ops.skipCache.baseItem && !ofBaseItem
    ? undefined
    : getItemClosure<T, K>();
  const fetchResult = (() => {
    const ref = shallowRef<ReturnData<T, K, typeof ofBaseItem>>();

    return computed({
      get: () => ref.value,
      set: (newval) => {
        ref.value = newval;
        void cachedRequest?.trigger();
        void cachedItems?.trigger(
          newval as ExtractBaseItemDtoResponse<ReturnData<T, K, typeof ofBaseItem>>
        );
      }
    });
  })();

  const cachedData = computed(() => {
    if (isFuncDefined() && stringArgs.value && !ops.skipCache.request) {
      return cachedRequest!.ref.value;
    }
  });
  const data = computed<ReturnData<T, K, typeof ofBaseItem>>((previous) => {
    if (ops.skipCache.request && fetchResult.value) {
      return ofBaseItem && !ops.skipCache.baseItem
        ? cachedItems?.ref.value ?? previous ?? fetchResult.value
        : fetchResult.value;
    } else {
      return cachedData.value;
    }
  });
  const isCached = computed(() =>
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (ops.skipCache.request || ops.skipCache.baseItem) || cachedData.value
  );

  /**
   * Function invoked per every data change.
   * @param onlyPending - Whether to run only pending requests or not
   */
  const run = async ({ onlyPending = false, isRefresh = false }): Promise<void> => {
    const { raw_api, raw_method } = rawParams();

    if (!raw_api || !raw_method) {
      return;
    }

    /**
     * Rerun previous parameters when the user is back online
     */
    if (offlineParams.length) {
      await Promise.all(offlineParams.map(p => fetchAndAdd(
        p.api,
        p.methodName,
        ofBaseItem,
        loading,
        stringArgs.value,
        ops,
        ...p.args
      )));
      offlineParams.length = 0;
    }

    if (argsRef.value && !onlyPending) {
      if (isConnectedToServer.value) {
        const resolved = await fetchAndAdd(
          raw_api,
          raw_method,
          ofBaseItem,
          isRefresh ? undefined : loading,
          stringArgs.value,
          ops,
          ...argsRef.value
        );

        fetchResult.value = resolved as ReturnData<T, K, typeof ofBaseItem>;
      } else {
        useSnackbar(i18next.t('offlineCantDoThisWillRetryWhenOnline'), 'error');

        offlineParams.push({
          api: raw_api,
          methodName: raw_method,
          args: argsRef.value
        });
      }
    }
  };

  return async function (this: any, ...args: ComposableParams<T, K, U>) {
    const normalizeArgs = (): Parameters<T[K]> => args.map(a => toValue(a)) as Parameters<T[K]>;
    const runNormally = async (): Promise<void> => {
      await run({});
    };
    const returnablePromise = async (): Promise<ReturnPayload<T, K, typeof ofBaseItem>> => {
      await runNormally();
      await until(() => isCached.value).toBeTruthy({ flush: 'pre' });

      return { loading, data };
    };

    argsRef.value = normalizeArgs();

    if (hasEffects) {
      const runWithRetry = async (): Promise<void> => {
        await run({ onlyPending: true });
      };

      /**
       * This will only run when ofBaseItem is true
       */
      const refreshBaseItem = () => {
        void cachedRequest?.trigger();
        void cachedItems?.trigger(
          fetchResult.value as ExtractBaseItemDtoResponse<ReturnData<T, K, typeof ofBaseItem>>
        );
      };

      setupEffects({
        args,
        argsRef,
        api,
        methodName,
        ofBaseItem,
        runNormally,
        runWithRetry,
        normalizeArgs,
        refreshBaseItem
      });
    }

    if (isFuncDefined()) {
      await cachedRequest?.trigger();

      /**
       * If there's available data before component mount, we return the cached data rightaway (see below how
       * we skip the promise) to get the component mounted as soon as possible.
       */
      if (isCached.value) {
        void run({ isRefresh: true });
      } else {
      /**
       * Wait for the cache to be populated before resolving the promise
       * If the promise never resolves (and the component never gets mounted),
       * the problem is that there is an issue in your logic, not in this composable.
       */
        return returnablePromise();
      }
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
 * Don't worry, TypeScript will tell you that `data` is always `never` when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @param ops.globalLoading - Show the global loading indicator or not for this request. Defaults to true.
 * This parameter is ignored if the request is already cached and it's being refreshed (no loading indicator is shown in that case).
 * @param ops.skipCache.request - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Whether to skip the cache or not. Useful for requests whose return value are known to be useless to cache,
 * like marking an item as played or favorite. Defaults to false.
 * @param ops.skipCache.baseItem - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Same as above, but also for baseItems. Defaults to false.
 * @returns data  - The BaseItemDto or BaseItemDto[] that was requested.
 * @returns loading - A boolean ref that indicates if the request is in progress. Undefined if there was an error
 */
export function useBaseItem<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRefOrGetter<K | undefined>,
  ops?: BaseItemComposableOps
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, true>> {
  return _sharedInternalLogic<T, K, U>(
    true,
    api,
    methodName,
    defu(ops ?? {}, defaultOps()) as Required<ComposableOps>
  );
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
 * Don't worry, TypeScript will tell you that `data` is always `never` when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @param ops - Composable options
 * @param ops.skipCache.request - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT.
 * Whether to skip the cache or not. Useful for requests whose return value are known to be useless to cache,
 * like marking an item as played or favorite. Defaults to false.
 * @param ops.globalLoading - Show the global loading indicator or not for this request. Defaults to true.
 * This parameter is ignored if the request is already cached and it's being refreshed (no loading indicator is shown in that case).
 * @returns data  - The request data.
 * @returns loading - A boolean ref that indicates if the request is in progress. Undefined if there was an error
 */
export function useApi<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRefOrGetter<K | undefined>,
  ops?: ComposableOps
): (this: any, ...args: ComposableParams<T, K, U>) => Promise<ReturnPayload<T, K, false>> {
  return _sharedInternalLogic<T, K, U>(
    false,
    api,
    methodName,
    defu(ops ?? {}, defaultOps()) as Required<ComposableOps>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */
