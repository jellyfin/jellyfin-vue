import { createApp } from 'vue';
import Vuetify from './plugins/vuetify';
import App from './App.vue';
import store from './store';

import 'vuetify/dist/vuetify.min.css';

const app = createApp(App);

app.use(Vuetify);
app.use(store);

app.mount('#app');
