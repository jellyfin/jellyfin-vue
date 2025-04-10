import { defineConfig } from 'eslint/config';
import { getBaseConfig, getNodeFiles, getTSVueConfig, tsFiles } from '@jellyfin-vue/configs/lint';
import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(false, import.meta.dirname),
  ...getNodeFiles(tsFiles)
]);
