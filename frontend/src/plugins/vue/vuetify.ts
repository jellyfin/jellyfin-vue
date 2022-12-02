import { createVuetify, ThemeDefinition } from 'vuetify';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { md3 } from 'vuetify/blueprints';
import { useI18n } from 'vue-i18n';
import { i18n } from '.';
import 'vuetify/styles';

const dark: ThemeDefinition = {
  colors: {
    accent: '#FF4081',
    'app-bar': '#1f2937',
    background: '#111827',
    card: '#1c2331',
    chip: '#4b5563',
    divider: '#374151',
    error: '#FF5252',
    info: '#0099CC',
    menus: '#374151',
    'navigation-drawer': '#1f2937',
    primary: '#9d37c2',
    secondary: '#2f3951',
    success: '#4CAF50',
    thumb: '#252e41',
    warning: '#FB8C00'
  },
  dark: true
};

const light: ThemeDefinition = {
  colors: {
    accent: '#FF4081',
    background: '#f2f2f2',
    card: '#FFFFFF',
    error: '#FF5252',
    info: '#33b5e5',
    primary: '#9d37c2',
    secondary: '#424242',
    success: '#4CAF50',
    thumb: '#000000',
    warning: '#FB8C00',
    chip: '#e4e4e4',
    menu: '#bbb'
  },
  dark: false
};

/**
 * If we don't define custom theme, Vuetify is going to take the
 * client's preferred color schema.
 */
const vuetify = createVuetify({
  blueprint: md3,
  defaults: {
    select: {
      variant: 'outlined'
    },
    textfield: {
      variant: 'outlined'
    }
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n })
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark,
      light
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
});

export default vuetify;
