import storybookConfig from '@jellyfin-vue/configs/storybook';
import { getPackagePath } from '@jellyfin-vue/configs/utils';
import { join } from 'node:path';

storybookConfig.core.builder.options.viteConfigPath = join(
  getPackagePath('@jellyfin-vue/frontend')!,
  'vite.config.ts'
);

// eslint-disable-next-line unicorn/prefer-export-from
export default storybookConfig;
