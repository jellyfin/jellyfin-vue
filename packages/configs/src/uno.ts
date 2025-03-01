import { defineConfig, presetWind3, transformerVariantGroup, presetIcons } from 'unocss';
import { lightColors, darkColors } from '@jellyfin-vue/shared/colors';

const themeColors = {
  ...Object.fromEntries(
    Object.keys(lightColors()).map(color => [
      color,
      `rgba(var(--j-theme-color-${color}))`
    ])
  ),
  ...Object.fromEntries(
    Object.keys(darkColors()).map(color => [
      color,
      `rgba(var(--j-theme-color-${color}))`
    ])
  )
};

export const defaultConfig = defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|ts|html)($|\?)/
      ]
    }
  },
  presets: [
    presetWind3({
      prefix: 'uno-',
      variablePrefix: 'j-util-',
      preflight: 'on-demand'
    }),
    presetIcons({
      mode: 'mask',
      warn: true,
      scale: 1.5
    })
  ],
  transformers: [
    transformerVariantGroup()
  ],
  rules: [
    ['uno-duration-default', { 'transition-duration': 'var(--j-theme-transition-duration)' }]
  ],
  shortcuts: [
    [
      /^uno-bg-(.+)$/,
      ([, c]) => {
        /**
         * If not included in the theme colors, return undefined so the original class prevails.
         * See @jellyfin-vue/ui-toolkit/components/JApp.vue to see how these variables are generated
         */
        if (c && c in themeColors) {
          return [{
            'background-color': `rgba(var(--j-theme-color-${c}), var(--j-util-bg-opacity, 1))`,
            'color': `var(--j-theme-color-${c}-text)`
          }];
        }
      }
    ]
  ],
  theme: {
    duration: {
      DEFAULT: 'var(--j-theme-transition-duration)'
    },
    colors: themeColors
  }
});
