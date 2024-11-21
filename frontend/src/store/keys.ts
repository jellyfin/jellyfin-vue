/**
 * This file contains all the symbols used with provide/inject API:
 * https://vuejs.org/guide/components/provide-inject.html#working-with-symbol-keys
 */
import type { ComputedRef, InjectionKey } from 'vue';

export const JView_isRouting = Symbol('JView:isRouting') as InjectionKey<ComputedRef<boolean>>;
