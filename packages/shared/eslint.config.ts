import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig } from '@jellyfin-vue/configs/lint';
import pkg from './package.json' with { type: 'json' };

export default [
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(false, import.meta.dirname)
] satisfies Linter.Config[];
