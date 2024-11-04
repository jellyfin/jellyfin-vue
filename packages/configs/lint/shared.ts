/**
 * Shared variables between rules
 */
export const eqeqeqConfig = ['error', 'always', { null: 'ignore' }];
export const tsFiles = ['*.ts', '**/*.ts'];
export const vueFiles = ['*.vue', '**/*.vue'];
export const vueAndTsFiles = [...vueFiles, ...tsFiles];
