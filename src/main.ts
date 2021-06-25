import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';

import { setupLayouts } from 'virtual:generated-layouts';
import messages from '@intlify/vite-plugin-vue-i18n/messages';

import Vuetify from './plugins/vuetify';
import App from './App.vue';
import { store, key } from './store';
import routes from './routes';
import { createAxios } from './plugins/axios';

const i18n = createI18n({
  legacy: false,
  messages
});
const app = createApp(App);
const router = createRouter({
  history: createWebHashHistory(),
  routes: setupLayouts(routes)
});
const axios = createAxios({ baseURL: 'http://localhost:8096' });

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
