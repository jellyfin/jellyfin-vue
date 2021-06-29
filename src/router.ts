import includes from 'lodash-es/includes';
// eslint-disable-next-line import/no-unresolved -- Virtual import
import { setupLayouts } from 'virtual:generated-layouts';
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

import Home from '~/views/home.vue';

export const routes: RouteRecordRaw[] = [
  { name: 'home', path: '/', component: Home }
];

const routesWithLayouts = setupLayouts(routes);

const router = createRouter({
  history: createWebHashHistory(),
  routes: routesWithLayouts
});

router.beforeEach((to, from, next) => {
  const publicPages = ['server-add'];
  const authRequired = !includes(publicPages, to.name?.toString() || '');
  const loggedIn = false;

  if (authRequired && !loggedIn) {
    // next('/server/add');
    console.debug(
      'You need to be authenticated to see this page. Redirecting to login page...'
    );
    next();
  } else {
    next();
  }
});

export default router;
