import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import regexp from 'eslint-plugin-regexp';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintImportX from 'eslint-plugin-import-x';
import vueScopedCSS from 'eslint-plugin-vue-scoped-css';
import css from 'eslint-plugin-css';
import vue from 'eslint-plugin-vue';
// @ts-expect-error - No types available
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import vueParser from 'vue-eslint-parser';
import { eqeqeqConfig, vueAndTsFiles, vueFiles, tsFiles } from '../shared';

const recommendedKey = 'flat/recommended';

/**
 * Util functions
 */
const flatArrayOfObjects = (obj: unknown[]) => Object.assign({}, ...obj);

/** Common TypeScript and Vue rules */
const common = defineConfig([
  {
    ...flatArrayOfObjects(tseslint.configs.strictTypeChecked),
    name: '(@jellyfin-vue/configs/lint/typescript-vue - typescript-eslint) Extended config from plugin (strict type checking)'
  },
  {
    ...flatArrayOfObjects(tseslint.configs.stylisticTypeChecked),
    name: '(@jellyfin-vue/configs/lint/typescript-vue - typescript-eslint) Extended config from plugin (stylistic type checking)'
  },
  {
    ...tseslint.configs.eslintRecommended,
    name: '(@jellyfin-vue/configs/lint/typescript-vue - typescript-eslint) Extended config from plugin (ESLint rules with type checking)'
  },
  {
    ...regexp.configs[recommendedKey],
    name: '(@jellyfin-vue/configs/lint/typescript-vue - regexp) Extended config from plugin'
  },
  {
    ...promise.configs[recommendedKey],
    name: '(@jellyfin-vue/configs/lint/typescript-vue - promise) Extended config from plugin'
  },
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - promise) Custom config',
    rules: {
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error'
    }
  },
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - import) Custom config',
    plugins: {
      'import-x': eslintImportX
    },
    rules: {
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/order': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-nodejs-modules': 'error',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true, 'considerQueryString': true }],
      // From the recommended preset
      'import-x/named': 'error',
      'import-x/export': 'error'
    }
  },
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - JSDoc) Custom config',
    plugins: {
      jsdoc
    },
    rules: {
      'jsdoc/require-hyphen-before-param-description': 'error',
      'jsdoc/require-description': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-jsdoc': 'error',
      'jsdoc/informative-docs': 'error'
    }
  },
  /**
   * TODO: Re-enable this at some point when the type checking is improved.
   * These rules are annoying when using not well-supported TypeScript libraries
   * and imported SFC files are not recognised properly and needs the use of:
   * https://github.com/ota-meshi/typescript-eslint-parser-for-extra-files
   */
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - TypeScript & Vue) Disable no-unsafe-* rules',
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - TypeScript & Vue) Custom config',
    rules: {
      // '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      'vue/return-in-computed-property': 'off'
    }
  },
  {
    ...sonarjs.configs.recommended,
    name: '(@jellyfin-vue/configs/lint/typescript-vue - sonarcloud) Extended config from plugin'
  },
  {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - sonarcloud) Custom config',
    rules: {
      'sonarjs/function-return-type': 'off'
    }
  }
]);

/** Vue SFC only rules */
const vue_config = defineConfig([
  ...vue.configs[recommendedKey].map((config) => {
    /**
     * Specified above, unnecessary to overwrite
     */
    delete config.languageOptions?.globals;
    /**
     * DEPRECATED: See https://eslint.vuejs.org/rules/component-tags-order.html#vue-component-tags-order
     * TODO: Remove when it's removed from the recommended rules
     */
    delete config.rules?.['vue/component-tags-order'];
    config.name = `(@jellyfin-vue/configs/lint/typescript-vue - ${config.name}) - Extended config from plugin`;

    return config;
  }),
  {
    ...flatArrayOfObjects(vueScopedCSS.configs[recommendedKey]),
    name: '(@jellyfin-vue/configs/lint/typescript-vue - Vue Scoped CSS) Extended config from plugin',
    files: vueFiles
  },
  {
    ...css.configs[recommendedKey],
    name: '(@jellyfin-vue/configs/lint/typescript-vue - Vue CSS) Extended config from plugin',
    files: vueFiles
  },
  {
    name: '(Vue) Custom config',
    files: vueFiles,
    rules: {
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          registeredComponentsOnly: false
        }
      ],
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
      }],
      'vue/html-closing-bracket-newline': ['error', { multiline: 'never' }],
      'vue/block-order': ['error', {
        order: ['template', 'script:not([setup])', 'script[setup]']
      }],
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/eqeqeq': eqeqeqConfig,
      'vue/block-lang': ['error',
        {
          script: {
            lang: 'ts'
          }
        }
      ],
      'vue/define-props-destructuring': 'error'
    }
  }
]);

/**
 * Gets the base configuration for TypeScript files only or both Vue and TypeScript
 *
 * @param enableVue - Whether to apply the base config for Vue files
 * @returns
 */
export function getTSVueConfig(enableVue = true, tsconfigRootDir = import.meta.dirname) {
  const result = [
    ...(enableVue ? vue_config : []),
    ...common.map(conf => ({
      ...conf, files: enableVue ? vueAndTsFiles : tsFiles
    }))];

  const langOptions = {
    ecmaVersion: 2024,
    sourceType: 'module',
    globals: {
      ...globals.browser
    }
  } as const;

  const sharedParserOptions = {
    projectService: true,
    tsconfigRootDir,
    warnOnUnsupportedTypeScriptVersion: false
  };

  // Extracted from https://github.com/vuejs/eslint-config-typescript
  const base_vue_parser = {
    name: '(@jellyfin-vue/configs/lint/typescript-vue - Vue) Extra parser configuration for typed linting',
    files: vueFiles,
    languageOptions: {
      ...langOptions,
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ...sharedParserOptions
      }
    }
  };

  const base_ts_parser = {
    name: enableVue
      ? '(@jellyfin-vue/configs/lint/typescript-vue - TypeScript & Vue) Parser extra config'
      : '(@jellyfin-vue/configs/lint/typescript-vue - TypeScript) Parser extra config',
    files: enableVue ? vueAndTsFiles : tsFiles,
    languageOptions: {
      ...langOptions,
      parserOptions: {
        ...sharedParserOptions,
        ...(enableVue
          ? {
              extraFileExtensions: ['.vue']
            }
          : {})
      }
    }
  };

  result.push(base_ts_parser);

  if (enableVue) {
    result.push(base_vue_parser);
  }

  return defineConfig(result);
}
