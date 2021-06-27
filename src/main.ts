import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import SwiperCore, { A11y, EffectFade, Keyboard, Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import messages from '@intlify/vite-plugin-vue-i18n/messages';

import Vuetify from './plugins/vuetify';
import App from './App.vue';
import { store, key } from './store';
import router from './router';
import { createAxios } from './plugins/axios';

import './assets/scss/utilities.scss';

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

SwiperCore.use([A11y, EffectFade, Keyboard, Virtual]);
app.component('Swiper', Swiper);
app.component('SwiperSlide', SwiperSlide);

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
