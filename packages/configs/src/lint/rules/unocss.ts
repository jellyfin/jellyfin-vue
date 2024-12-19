import type { Linter } from 'eslint';
import UnoPlugin from '@unocss/eslint-config/flat';

export const unocss = [
  {
    ...UnoPlugin,
    name: '(unocss) Extended config from plugin'
  }
] satisfies Linter.Config[];
