import { defineConfig } from 'eslint/config';
import { getBaseConfig, getTSVueConfig, getNodeFiles, unocss, getWorkerFiles } from '@jellyfin-vue/configs/lint';
import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  ...getBaseConfig(pkg.name),
  ...getTSVueConfig(true, import.meta.dirname),
  ...unocss,
  ...getNodeFiles(),
  ...getWorkerFiles(),
  {
    name: '(@jellyfin-vue/frontend) Ignored files',
    ignores: [
      'types/global/routes.d.ts',
      'types/global/components.d.ts'
    ]
  }
]);
