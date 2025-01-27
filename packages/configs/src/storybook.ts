import type { StorybookConfig } from '@storybook/vue3-vite';

export default {
  stories: ['./stories/**/*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        docgen: 'vue-component-meta',
        viteConfigPath: undefined as undefined | string
      }
    }
  },
  // TODO: Needed because vue-docgen-plugin doesn't recognize functional components
  viteFinal(config) {
    // @ts-expect-error - Incorrect type in Vite config, but this is a temporal workaround regardless
    const vueDocgenIndex = config.plugins?.findIndex(({ name }) => name === 'storybook:vue-docgen-plugin');

    if (vueDocgenIndex) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      config.plugins?.splice(vueDocgenIndex, 1);
    }

    return config;
  }
} satisfies StorybookConfig;
