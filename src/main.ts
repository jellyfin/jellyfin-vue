import './assets/scss/utilities.scss';
import 'swiper/swiper.scss';
import 'swiper/components/a11y/a11y.scss';
import 'swiper/components/effect-fade/effect-fade.scss';

// eslint-disable-next-line import/no-unresolved -- Virtual import
import messages from '@intlify/vite-plugin-vue-i18n/messages';
import SwiperCore, {
  A11y,
  Autoplay,
  EffectFade,
  Keyboard,
  Pagination,
  Virtual
} from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';

import App from './app.vue';
import { createAxios } from './plugins/axios';
import Vuetify from './plugins/vuetify';
import router from './router';
import { key, store } from './store';

const app = createApp(App);
// eslint-disable-next-line unicorn/prevent-abbreviations -- False positive
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

app.directive('hide', (element, binding) => {
  if (element) {
    element.style.visibility = binding.value === true ? 'hidden' : 'visible';
  }
});

app.mount('#app');
