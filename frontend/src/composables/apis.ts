import { remote } from '@/plugins/remote';
import { apiStore } from '@/store/api';
import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosResponse } from 'axios';
import { isNil } from 'lodash-es';
import { computed, getCurrentScope, isRef, ref, toValue, unref, watch, type ComputedRef, type MaybeRef, type Ref } from 'vue';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
/**
 * BetterOmit still provides IntelliSense fedback, unlike the built-in Omit type.
 * See https://github.com/microsoft/TypeScript/issues/56135
 */
type BetterOmit<T, K extends keyof any> = T extends Record<any, any>
  ? {
      [P in keyof T as P extends K ? never : P]: T[P]
    }
  : T;
/**
 * Make all the properties of a type mutable.
 */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
type OmittedKeys = 'fields' | 'userId' | 'enableImages' | 'enableTotalRecordCount' | 'enabledImageTypes';
type ParametersAsGetters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any
  ? { [K in keyof P]: () => BetterOmit<Mutable<P[K]>, OmittedKeys> }
  : never;
type ExtractResponseDataType<T> = Awaited<T> extends AxiosResponse<infer U, any> ? U : undefined;
type Validate<T, U> = T extends U ? U : never;
type ComposableParams<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>> =
  Validate<ParametersAsGetters<T[K]>, U>;
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
  ExtractResponseDataType<T>));

type ReturnData<T extends Record<K, (...args: any[]) => any>, K extends keyof T, J extends boolean> =
  J extends true ? ExtractBaseItemDtoResponse<ReturnType<T[K]>> : ExtractResponseType<ReturnType<T[K]>>;

interface ReturnPayload<T extends Record<K, (...args: any[]) => any>, K extends keyof T, J extends boolean> {
  loading: Ref<boolean>,
  data: ComputedRef<ReturnData<T, K, J>>;
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
async function resolveAndAdd<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: ((api: Api) => T) | undefined,
  methodName: K | undefined,
  ofBaseItem: boolean,
  loading: Ref<boolean>,
  skipCache: boolean,
  ...args: ComposableParams<T,K,U>): Promise<void> {
  if (!isNil(api) && !isNil(methodName)) {
    /**
     * We add all BaseItemDto's fields for consistency in what we can expect from the store.
     * toValue normalizes the getters.
     */
    const extendedParams = [
      {
        ...toValue(args[0]),
        ...(remote.auth.currentUserId && { userId: remote.auth.currentUserId }),
        fields: apiStore.apiEnums.fields,
        enabledImageTypes: apiStore.apiEnums.images,
        enableImages: true,
        enableTotalRecordCount: false
      },
      ...args.slice(1).map((a) => toValue(a))
    ] as Parameters<T[K]>;

    try {
      loading.value = true;

      const stringifiedArgs = JSON.stringify(args.map((a) => toValue(a)));
      const funcName = `${api.name}.${String(methodName)}`;
      const response = await remote.sdk.newUserApi(api)[methodName](...extendedParams) as Awaited<ReturnType<T[K]>>;

      if (response.data) {
        const requestData = response.data as Awaited<ReturnType<T[K]>['data']>;
        const result = 'Items' in requestData && Array.isArray(requestData.Items) ? requestData.Items : requestData;

        if (ofBaseItem && !skipCache) {
          apiStore.baseItemAdd(result as BaseItemDto | BaseItemDto[]);
        }

        if (!skipCache) {
          apiStore.requestAdd(funcName, stringifiedArgs, ofBaseItem, result);
        }
      }
    } catch {} finally {
      loading.value = false;
    }
  }
}

/**
 * This is the internal logic of the composables
 */
function _sharedInternalLogic<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  ofBaseItem: boolean,
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRef<K | undefined>,
  skipCache: MaybeRef<boolean> = false
): (this: any, ...args: ComposableParams<T,K,U>) => Promise<ReturnPayload<T, K, typeof ofBaseItem>> {

  const loading = ref(true);
  const argsRef = ref<Parameters<T[K]>>();
  const stringArgs = computed(() => {
    return JSON.stringify(argsRef.value);
  });

  const data = computed<ReturnData<T, K, typeof ofBaseItem>>(() =>
    apiStore.getRequest(`${String(unref(api)?.name)}.${String(unref(methodName))}`, stringArgs.value) as ReturnData<T, K, typeof ofBaseItem>
  );

  return async function (this: any, ...args: ComposableParams<T,K,U>) {
    const setArgs = (): void => {
      argsRef.value = args.map((a) => toValue(a)) as Parameters<T[K]>;
    };

    setArgs();

    const run = async (args: ComposableParams<T,K,U>): Promise<void> => {
      try {
        await resolveAndAdd(unref(api), unref(methodName), ofBaseItem, loading, unref(skipCache), ...args);
      } catch {}
    };
    const isCached = Boolean(data.value);

    if (getCurrentScope() !== undefined) {
      watch(args, async () => {
        setArgs();
        await run(args);
      });
      isRef(api) && watch(api, async () => await run(args));
      isRef(methodName) && watch(methodName, async () => await run(args));
      isRef(skipCache) && watch(skipCache, async () => await run(args));

      /**
       * If there's available data before component mount, we return the cached data rightaway (see below how
       * we skip the promise) to get the component mounted as soon as possible.
       * However, we queue a request to the server to update the data after the component is
       * mounted
       */
      isCached && window.setTimeout(async () => {
        await run(args);
      });
    }

    !isCached && await run(args);

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
 *
 * Don't worry, TypeScript will tell you that `data` is always undefined when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @returns data  - The BaseItemDto or BaseItemDto[] that was requested.
 * @returns loading - A boolean ref that indicates if the request is in progress.
 */
export function useBaseItem<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRef<K | undefined>
): (this: any, ...args: ComposableParams<T,K,U>) => Promise<ReturnPayload<T, K, true>> {
  return _sharedInternalLogic<T, K, U>(true, api, methodName);
}

/**
 * Reactively performs requests to the API:
 *
 * - When the parameters of the request changes, the request is performed again and the ComputedRef returns updated data.
 * - Caches the request response in the apiStore
 * - If there's already cached data in the store for the given parameters, a request to the
 * server it's still performed to refresh, but the Promise will be resolved
 * immediately and the ComputedRef will return the cached data first.
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
 *
 * Don't worry, TypeScript will tell you that `data` is always undefined when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @param skipCache - USE WITH CAUTION, SINCE IT'S BETTER TO CACHE EVERYTHING BY DEFAULT. Defaults to false.
 * Whether to skip the cache or not. Useful for requests whose return value are known to be useless to cache,
 * like marking an item as played or favorite.
 * @returns data  - The request data.
 * @returns loading - A boolean ref that indicates if the request is in progress.
 */
export function useApi<T extends Record<K, (...args: any[]) => any>, K extends keyof T, U extends ParametersAsGetters<T[K]>>(
  api: MaybeRef<((api: Api) => T) | undefined>,
  methodName: MaybeRef<K | undefined>,
  skipCache: MaybeRef<boolean> = false
): (this: any, ...args: ComposableParams<T,K,U>) => Promise<ReturnPayload<T, K, false>> {
  return _sharedInternalLogic<T, K, U>(false, api, methodName, skipCache);
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
