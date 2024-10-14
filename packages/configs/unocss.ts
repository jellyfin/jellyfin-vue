import { defineConfig, presetUno } from 'unocss';

export const defaultConfig = defineConfig({
  presets: [
    presetUno({
      prefix: 'uno-',
      preflight: false
    })
  ],
  theme: {
    colors: {
      background: 'rgb(var(--j-color-background))'
    }
  }
});
