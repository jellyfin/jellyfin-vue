/* eslint-disable unicorn/prefer-module */
import VueI18n from '@intlify/vite-plugin-vue-i18n';
import Vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';
import ViteComponents from 'vite-plugin-components';
import Layouts from 'vite-plugin-vue-layouts';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`
    }
  },
  plugins: [
    Vue({
      include: [/\.vue$/]
    }),
    ViteComponents({
      dirs: ['src/modules', 'src/components'],
      deep: true,
      globalComponentsDeclaration: true
    }),
    Layouts(),
    VueI18n({
      include: path.resolve(__dirname, './src/locales/**')
    })
  ],
  optimizeDeps: {
    include: ['vue', 'vue-router', '@vueuse/core'],
    exclude: ['vue-demi', 'vuetify']
  }
});
/* eslint-enable unicorn/prefer-module */
