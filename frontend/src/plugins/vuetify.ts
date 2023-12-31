import * as vuetifyLocales from 'virtual:locales/vuetify';
import { defaultRtl } from 'virtual:locales/vuetify/rtl';
import { createVuetify, ThemeDefinition } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';

const dark: ThemeDefinition = {
  colors: {
    accent: '#FF4081',
    background: '#111827',
    card: '#1c2331',
    chip: '#4b5563',
    divider: '#374151',
    error: '#FF5252',
    info: '#0099CC',
    menu: '#374151',
    surface: '#1f2937',
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
    surface: '#f5f5f5'
  },
  dark: false
};

/**
 * If we don't define custom theme, Vuetify is going to take the
 * client's preferred color schema.
 */
export const vuetify = createVuetify({
  blueprint: md3,
  defaults: {
    VSelect: {
      variant: 'outlined'
    },
    VTextField: {
      variant: 'outlined',
      color: 'primary'
    },
    VCheckbox: {
      color: 'primary'
    },
    VProgressLinear: {
      color: 'primary'
    },
    VBtn: {
      color: undefined,
      variant: 'text'
    },
    VTooltip: {
      activator: 'parent'
    },
    VMenu: {
      activator: 'parent'
    },
    VChip: {
      rounded: true
    }
  },
  locale: {
    fallback: 'en',
    messages: vuetifyLocales,
    rtl: defaultRtl
  },
  theme: {
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
