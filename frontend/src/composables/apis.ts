
import { remote } from '@/plugins/remote';
import { items } from '@/store/items';
import type { Api } from '@jellyfin/sdk';
import { ItemFields, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosResponse } from 'axios';
import { computed, getCurrentScope, ref, toValue, watch, type ComputedRef, type Ref } from 'vue';

const allFields = Object.freeze(Object.values(ItemFields));

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
type ExtractResponseType<T> = Awaited<T> extends AxiosResponse<infer U, any> ?
    (U extends BaseItemDto ? U : (U extends BaseItemDto[] ? U : undefined))
  : undefined;
type ParametersAsGetters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? { [K in keyof P]: () => P[K] } : never;

/**
 * Ensures the function is used in the given
 * @param func - The function to check.
 * @returns True if the function is of type Function, false otherwise.
 */
function ensureCorrectUsage(func: any): void {
  if (typeof func !== 'function') {
    throw new TypeError('The given key is not a function for the given API');
  }
}

/**
 * Reactively performs item requests to the API:
 *
 * - When the parameters of the request changes, the request is performed again and the ComputedRef returns updated data
 * - If there's already cached data in the offline store for the given parameters, a request to the
 * server it's still performed, but the ComputedRef will return the cached data first and then the server data.
 *
 * This composable also returns a promise, so it prevents rendering the component with Suspense until the initial request is done
 * (ensuring this way the data is always available before mount).
 * See [Vue docs](https://vuejs.org/guide/built-ins/suspense.html#suspense) for more information.
 *
 * Here's an usage example:
 *
 * ```ts
 * const { loading, data: item } = await useBaseItem(getUserLibraryApi, 'getItem')(() => {
 *   ...the request parameters
 * });
 * ```
 *
 * Caveats:
 * - If not used inside a component's <script setup> area (orn any Vue's effctScope), changing parameters will not be reactive.
 * This is done in order to avoid memory leaks.
 * - **Request parameters must be passed as getters (like props on watchers)**.
 * - It only works with requests that return BaseItemDto or BaseItemDto[] responses. If you need to use another type, you **must** use the `useApi` composable.
 * TypeScript will tell you that `data` is always undefined when you can't use the composable with an specific API method.
 *
 * @param api - The API's endpoint to use.
 * @param methodname- - The operation to execute.
 * @returns data  - The BaseItemDto or BaseItemDto[] that was requested.
 * @returns loading - A boolean ref that indicates if the request is in progress.
 */
export function useBaseItem<T extends Record<K, (...args: any[]) => any>, K extends keyof T>(
  api: (api: Api) => T,
  methodName: K
): (this: any, ...args: ParametersAsGetters<T[K]>) => Promise<{ loading: Ref<boolean>, data: ComputedRef<ExtractResponseType<ReturnType<T[K]>>> }> {
  ensureCorrectUsage(remote.sdk.newUserApi(api)[methodName]);

  let initialFetchDone = false;
  const loading = ref(true);
  const requestData = ref<Awaited<ReturnType<T[K]>['data']>>();
  const calledFunctions = computed(() => `${api.name}.${methodName.toString()}`);

  /**
   * Returns a proxy ref from the store
   */
  // @ts-expect-error - Typings get too complex at this point
  const data = computed<ExtractResponseType<ReturnType<T[K]>>>(() => {
    if (typeof requestData.value === 'object') {
      // @ts-expect-error - We check both capitalizations just in case
      const itemArray: BaseItemDto[] | undefined = requestData.value.items ?? requestData.value.Items;

      if (Array.isArray(itemArray)) {
        const ids = itemArray.map((i) => i.Id).filter((id): id is string => typeof id === 'string');

        return items.getItemsById(ids).filter((item): item is BaseItemDto => typeof item === 'object');
      } else {
        return items.getItemById((requestData.value as BaseItemDto).Id);
      }
    }
  });

  const resolveAndAdd = async (args: Array<() => ParametersAsGetters<T[K]>>): Promise<void> => {
    /**
     * We add all BaseItemDto's fields for consistency in what we can expect from the store.
     * toValue normalizes the getters.
     */
    const extendedParams = [
      { ...toValue(args[0]), fields: allFields },
      ...args.slice(1).map((a) => toValue(a))
    ] as Parameters<T[K]>;

    try {
      loading.value = true;

      const response = await remote.sdk.newUserApi(api)[methodName](...extendedParams) as Awaited<ReturnType<T[K]>>;

      if (response.data) {
        requestData.value = response.data;
        items.rawAdd(response.data as BaseItemDto | BaseItemDto[]);
      } else {
        requestData.value = undefined;
      }
    } catch {} finally {
      loading.value = false;
      initialFetchDone = true;
    }
  };

  return async function (this: any, ...args: ParametersAsGetters<T[K]>) {
    if (getCurrentScope() !== undefined) {
      watch([args, calledFunctions], async () => {
        if (initialFetchDone) {
          await resolveAndAdd(args);
        }
      });
    }

    await resolveAndAdd(args);

    return { loading, data };
  };
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
