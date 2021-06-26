import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import HelloWorld from './components/HelloWorld.vue';

export const routes: RouteRecordRaw[] = [
  { name: 'home', path: '/', component: HelloWorld }
];

const routesWithLayouts = setupLayouts(routes);

console.dir(routesWithLayouts);

const router = createRouter({
  history: createWebHashHistory(),
  routes: routesWithLayouts
});

router.beforeEach((to, from, next) => {
  const publicPages = ['server-add'];
  const authRequired = !publicPages.includes(to.name?.toString() || '');
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
