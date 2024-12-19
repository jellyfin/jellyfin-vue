import type { Linter } from 'eslint';
import globals from 'globals';

/**
 * Gets the ESLint config from Node.js and development related files
 * @param files - Defaults to `*config.*` and files under `scripts` folder
 */
export function getNodeFiles(files = ['*.config.*', 'scripts/**/*.ts']): Linter.Config[] {
  return [{
    name: '(@jellyfin-vue/configs/lint/env) Node.js and development-related files',
    files,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.nodeBuiltin
      }
    },
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true
        }
      ],
      'import-x/no-nodejs-modules': 'off',
      'unicorn/no-process-exit': 'off'
    }
  }
  ];
}

/**
 * Gets the rules config for WebWorker files
 * @param files - Defaults to `*.worker.ts` files
 */
export function getWorkerFiles(files = ['**/*.worker.ts']): Linter.Config[] {
  return [{
    name: '(@jellyfin-vue/configs/lint/env) WebWorkers',
    files,
    languageOptions: {
      globals: {
        ...globals.worker
      }
    }
  }];
}
