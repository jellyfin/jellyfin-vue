import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import messages from '@intlify/vite-plugin-vue-i18n/messages';

import Vuetify from './plugins/vuetify';
import App from './App.vue';
import { store, key } from './store';
import router from './router';
import { createAxios } from './plugins/axios';

const app = createApp(App);
const i18n = createI18n({
  legacy: false,
  messages
});

const axios = createAxios({
  baseURL: 'https://demo.jellyfin.org/stable'
});

app.use(i18n);
app.use(Vuetify);
app.use(store, key);
app.use(router);
app.use(axios);

app.directive('hide', (el, binding) => {
  if (el) {
    if (binding.value === true) {
      el.style.visibility = 'hidden';
    } else {
      el.style.visibility = 'visible';
    }
  }
});

app.mount('#app');
