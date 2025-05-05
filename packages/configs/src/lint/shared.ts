import type { Linter } from 'eslint';

/**
 * Shared variables between rules
 */
export const eqeqeqConfig = ['error', 'always', { null: 'ignore' }] satisfies Linter.RuleEntry;
export const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
export const jsFiles = ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'];
export const vueFiles = ['**/*.vue'];
export const vueAndTsFiles = [...vueFiles, ...tsFiles];
export const ignoresForOtherLangs = [...vueAndTsFiles, ...jsFiles];
