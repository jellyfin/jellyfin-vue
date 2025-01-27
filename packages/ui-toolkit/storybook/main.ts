import storybookConfig from '@jellyfin-vue/configs/storybook';

storybookConfig.core.builder.options.viteConfigPath = '../../frontend/vite.config.ts';

// eslint-disable-next-line unicorn/prefer-export-from
export default storybookConfig;
