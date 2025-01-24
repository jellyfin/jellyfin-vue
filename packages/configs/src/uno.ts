import { defineConfig, presetUno, transformerVariantGroup, presetIcons } from 'unocss';

export const defaultConfig = defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|ts|html)($|\?)/
      ]
    }
  },
  presets: [
    presetUno({
      prefix: 'uno-',
      variablePrefix: 'j-util-',
      preflight: 'on-demand'
    }),
    presetIcons({
      scale: 1.5
    })
  ],
  transformers: [
    transformerVariantGroup()
  ],
  rules: [
    ['uno-duration-default', { 'transition-duration': 'var(--j-theme-transition-duration)' }]
  ],
  theme: {
    duration: {
      DEFAULT: 'var(--j-theme-transition-duration)'
    },
    colors: {
      background: 'rgba(var(--j-theme-color-background))',
      menu: 'rgba(var(--j-theme-color-menu))'
    }
  }
});
