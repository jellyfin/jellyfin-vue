import { defaultConfig } from '@jellyfin-vue/configs/x18n';

export default {
  ...defaultConfig,
  resources: [
    {
      pattern: 'strings/{locale}.{ext}'
    }
  ],
  /**
   * Packages that use the strings of this package
   */
  usage: {
    include: [
      '../frontend/**',
      '../ui-toolkit/**'
    ]
  }
} satisfies typeof defaultConfig;
