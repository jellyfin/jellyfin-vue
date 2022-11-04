import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';

const router = createRouter({
  history: __HISTORY_ROUTER_MODE__
    ? createWebHistory()
    : createWebHashHistory(),
  routes: setupLayouts(generatedRoutes)
});

export default router;
