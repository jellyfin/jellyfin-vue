import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [
    presetUno({
      prefix: 'uno-',
      preflight: false
    })
  ]
});
