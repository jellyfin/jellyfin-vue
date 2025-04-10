import { defineConfig } from 'eslint/config';
import { getBaseConfig, getTSVueConfig } from '@jellyfin-vue/configs/lint';
import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(false, import.meta.dirname)
]);
