import { createVuetify, ThemeDefinition } from 'vuetify';

const dark: ThemeDefinition = {
  dark: true,
  colors: {
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
  }
};

const light: ThemeDefinition = {
  dark: false,
  colors: {
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
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark,
      light
    }
  }
});
