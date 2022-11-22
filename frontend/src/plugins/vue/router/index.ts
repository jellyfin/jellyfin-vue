import {
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import loginGuard from './middlewares/login';
import adminGuard from './middlewares/admin-pages';

const router = createRouter({
  history: __HISTORY_ROUTER_MODE__
    ? createWebHistory()
    : createWebHashHistory(),
  routes: setupLayouts(generatedRoutes)
});

router.beforeEach(loginGuard);
router.beforeEach(adminGuard);

export default router;
