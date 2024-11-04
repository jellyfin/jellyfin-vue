import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig, getNodeFiles, tsFiles } from './eslint/';

export default [
  ...getBaseConfig('@jellyfin-vue/configs'),
  ...getTSVueConfig(false, import.meta.dirname),
  ...getNodeFiles(tsFiles)
] satisfies Linter.Config[];
