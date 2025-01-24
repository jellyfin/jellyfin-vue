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
      options: {}
    }
  }
} satisfies StorybookConfig;
