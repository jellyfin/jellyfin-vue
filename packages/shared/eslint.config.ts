import { defineConfig } from 'eslint/config';
import { getBaseConfig, getTSVueConfig, getNodeFiles } from '@jellyfin-vue/configs/lint';
import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(pkg.name, false, import.meta.dirname),
  ...getNodeFiles(pkg.name, ['./src/node/**/*.ts'])
]);
