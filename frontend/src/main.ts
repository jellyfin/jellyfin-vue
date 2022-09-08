import '@/assets/scss/app.scss';
import App from '@/App.vue';
import Vue from 'vue';
import '@/plugins/vue/components';
import '@/plugins/vue/directives';
import store from '@/store';
import router from '@/plugins/vue/router';
import i18n from '@/plugins/vue/i18n';

Vue.config.performance = true;

const app = new Vue({
  auth,
  router,
  store,
  vuetify,
  i18n,
  render: (h) => h(App)
});

app.$mount('#app');
