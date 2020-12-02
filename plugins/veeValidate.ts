import { Plugin } from '@nuxt/types/app';
import { configure, extend } from 'vee-validate';
import { required } from 'vee-validate/dist/rules';

extend('required', {
  ...required,
  message: 'staticmsg - This field is required [vee-validate]'
});

extend('mustBeUrl', (value: string): boolean => {
  return /^https?:\/\/.+/.test(value);
});

export default function ({ app }): any {
  configure({
    defaultMessage: (field, values) => {
      values._field_ = app.i18n.t(`fields.${field}`);
      return app.i18n.t(`validation.${values._rule_}`, values);
    }
  });
}
// const veeValidate: Plugin = ({ app }) => {
//   configure({
//     defaultMessage: (field, values) => {
//       values._field_ = app.i18n.t(`fields.${field}`);
//       return app.i18n.t(`validation.${values._rule_}`, values);
//     }
//   });
// };
// export default veeValidate;
