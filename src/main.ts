import { createApp } from 'vue';
import Vuetify from './plugins/vuetify';
import App from './App.vue';

import 'vuetify/dist/vuetify.min.css';

const app = createApp(App);

app.use(Vuetify);

app.mount('#app');
