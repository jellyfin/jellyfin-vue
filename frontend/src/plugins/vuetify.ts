import { darkColors, lightColors } from '@jellyfin-vue/shared/colors';
import * as vuetifyLocales from 'virtual:locales/vuetify';
import { createVuetify, type ThemeDefinition } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';

const dark: ThemeDefinition = {
  colors: darkColors(),
  dark: true
};

const light: ThemeDefinition = {
  colors: lightColors(),
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
    messages: vuetifyLocales
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
