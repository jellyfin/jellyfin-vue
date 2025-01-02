import { defineConfig, presetUno, transformerVariantGroup } from 'unocss';

export const defaultConfig = defineConfig({
  presets: [
    presetUno({
      prefix: 'uno-',
      variablePrefix: 'j-',
      preflight: 'on-demand'
    })
  ],
  transformers: [
    transformerVariantGroup()
  ],
  theme: {
    colors: {
      background: 'rgb(var(--j-color-background))'
    }
  }
});
