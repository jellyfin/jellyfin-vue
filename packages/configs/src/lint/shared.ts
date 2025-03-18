import type { Linter } from 'eslint';

/**
 * Shared variables between rules
 */
export const eqeqeqConfig = ['error', 'always', { null: 'ignore' }] satisfies Linter.RuleEntry;
export const tsFiles = ['*.ts', '**/*.ts'];
export const vueFiles = ['*.vue', '**/*.vue'];
export const vueAndTsFiles = [...vueFiles, ...tsFiles];
