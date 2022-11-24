import { configure, extend } from 'vee-validate';
import { required } from 'vee-validate/dist/rules';
import { urlRegEx } from '~/utils/servers';

// Rules
extend('required', required);

extend('mustBeUrl', (value: string): boolean => {
  return urlRegEx.test(value);
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
