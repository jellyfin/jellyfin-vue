import Vue from 'vue';
import VueAwesomeSwiper from 'vue-awesome-swiper';
import Swiper from 'swiper';
import 'swiper/css/swiper.css';

declare module 'vue/types/vue' {
  interface Vue {
    $swiper: Swiper;
  }
}

Vue.use(VueAwesomeSwiper);
