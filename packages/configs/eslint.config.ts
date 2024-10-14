import type { Linter } from 'eslint';
import { getBaseConfig } from './eslint/rules/base';
import { getTSVueConfig } from './eslint/rules/typescript-vue';

export default [
  ...getBaseConfig('@jellyfin-vue/configs'),
  ...getTSVueConfig(false, import.meta.dirname)
] satisfies Linter.Config[];
