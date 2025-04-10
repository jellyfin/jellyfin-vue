import { defineConfig } from 'eslint/config';
import UnoPlugin from '@unocss/eslint-config/flat';

export const unocss = defineConfig([
  {
    ...UnoPlugin,
    name: '(unocss) Extended config from plugin'
  }
]);
