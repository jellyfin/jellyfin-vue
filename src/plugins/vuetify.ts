import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/lib/styles/main.sass';
import { createVuetify } from '@vuetify/nightly';
import * as components from '@vuetify/nightly/lib/components';
import * as directives from '@vuetify/nightly/lib/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#0086B3',
          secondary: '#2F3951',
          surface: '#1C2331',
          accent: '#FF4081',
          info: '#0099CC',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#14141F',
          card: '#1c2331',
          thumb: '#252e41'
        },
        variables: {}
      },
      light: {
        dark: false,
        colors: {
          primary: '#00A4DC',
          secondary: '#424242',
          surface: '#FFFFFF',
          accent: '#FF4081',
          info: '#33b5e5',
          warning: '#FB8C00',
          error: '#FF5252',
          success: '#4CAF50',
          background: '#f2f2f2',
          card: '#FFFFFF',
          thumb: '#000000'
        },
        variables: {}
      }
    }
  }
});
