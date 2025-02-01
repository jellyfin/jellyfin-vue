/**
 * This file contains all the symbols used with provide/inject API:
 * https://vuejs.org/guide/components/provide-inject.html#working-with-symbol-keys
 */
import type { InjectionKey, StyleValue, Ref } from 'vue';

export const JMain_style = Symbol('JMain:style') as InjectionKey<Ref<StyleValue[]>>;
