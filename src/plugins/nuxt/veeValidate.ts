import { Plugin } from '@nuxt/types/app';
import { configure, extend } from 'vee-validate';
import { required } from 'vee-validate/dist/rules';

// Rules
extend('required', required);

extend('mustBeUrl', (value: string): boolean => {
  return /^(https?:\/\/)?[0-9.]+(:[0-9]+)?/.test(value);
});

extend('bothPasswordsSame', {
  params: ['target'],
  // @ts-expect-error - target typing doesn't exist as we declared it in params.
  validate(value, { target }) {
    return value === target;
  }
});

const veeValidate: Plugin = ({ app }) => {
  configure({
    defaultMessage: (_field, values) => {
      return app.i18n.t(`validation.${values._rule_}`, values);
    }
  });
};
export default veeValidate;
