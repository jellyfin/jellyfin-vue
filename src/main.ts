import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import SwiperCore, {
  A11y,
  Autoplay,
  EffectFade,
  Keyboard,
  Pagination,
  Virtual
} from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';

import messages from '@intlify/vite-plugin-vue-i18n/messages';

import Vuetify from './plugins/vuetify';
import App from './App.vue';
import { store, key } from './store';
import router from './router';
import { createAxios } from './plugins/axios';

import './assets/scss/utilities.scss';
import 'swiper/swiper.scss';
import 'swiper/components/a11y/a11y.scss';
import 'swiper/components/effect-fade/effect-fade.scss';

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

SwiperCore.use([A11y, Autoplay, EffectFade, Keyboard, Pagination, Virtual]);
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
