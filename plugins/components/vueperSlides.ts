import Vue from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Need to build a Type package for the module
// @ts-ignore
import { VueperSlides, VueperSlide } from 'vueperslides';
import 'vueperslides/dist/vueperslides.css';

Vue.component('vueper-slides', VueperSlides);
Vue.component('vueper-slide', VueperSlide);
