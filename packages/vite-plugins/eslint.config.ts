import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig, getNodeFiles, tsFiles } from '@jellyfin-vue/configs/eslint';

export default [
  ...getBaseConfig('@jellyfin-vue/vite-plugins'),
  ...getTSVueConfig(false, import.meta.dirname),
  ...getNodeFiles(tsFiles)
] satisfies Linter.Config[];
