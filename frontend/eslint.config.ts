import type { Linter } from 'eslint';
import { getBaseConfig, getTSVueConfig, getNodeFiles, unocss, getWorkerFiles } from '@jellyfin-vue/configs/eslint';

// TODO: Add missing rules for i18n and json
export default [
  ...getBaseConfig('@jellyfin-vue/frontend'),
  ...getTSVueConfig(true, import.meta.dirname),
  ...unocss,
  ...getNodeFiles(),
  ...getWorkerFiles()
] satisfies Linter.Config[];
