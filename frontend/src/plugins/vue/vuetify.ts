/** Vuetify Plugin */
import type { UserVuetifyPreset } from 'vuetify';
import variables from '@/assets/styles/variables.scss';
import Vuetify from 'vuetify';
import Vue from 'vue';

export default createVuetify({
  customVariables: [variables],
  treeShake: true,
  defaultAssets: false,
  theme: {
    dark: true,
    default: 'dark',
    disable: false,
    themes: {
      dark: {
        primary: '#9d37c2',
        secondary: '#2f3951',
        accent: '#FF4081',
        info: '#0099CC',
        warning: '#FB8C00',
        error: '#FF5252',
        success: '#4CAF50',
        background: '#14141F',
        card: '#1c2331',
        thumb: '#252e41'
      },
      light: {
        primary: '#9d37c2',
        secondary: '#424242',
        accent: '#FF4081',
        info: '#33b5e5',
        warning: '#FB8C00',
        error: '#FF5252',
        success: '#4CAF50',
        background: '#f2f2f2',
        card: '#FFFFFF',
        thumb: '#000000'
      }
    },
    options: {
      customProperties: true
    }
  }
});

/** Create Vuetify */
export function createVuetify(options: UserVuetifyPreset): Vuetify {
  Vue.use(Vuetify);
  return new Vuetify(options);
}
