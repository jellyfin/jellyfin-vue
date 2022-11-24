import { createVuetify, ThemeDefinition } from 'vuetify';
import { md3 } from 'vuetify/blueprints';

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#111827',
    'navigation-drawer': '#1f2937',
    'app-bar': '#1f2937',
    dividers: '#374151',
    cards: '#1f2937',
    chips: '#4b5563',
    menus: '#374151',
    primary: '#edf2f7'
  }
};

const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f2f2f2',
    chip: '#e4e4e4',
    menus: '#bbb'
  }
};

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
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark,
      light
    }
  }
});

export default vuetify;
