import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig, getNodeFiles } from '@jellyfin-vue/configs/eslint';

export default [
  ...getBaseConfig('@jellyfin-vue/vite-plugins'),
  ...getTSVueConfig(false, import.meta.dirname),
  ...getNodeFiles()
] satisfies Linter.Config[];
