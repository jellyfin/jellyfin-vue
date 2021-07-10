import { RouteRecordRaw } from 'vue-router';

import HomePage from '../../presentation/pages/HomePage.vue';

// Register routes for the module here
const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    component: HomePage
  }
];

export default routes;
