import VueRouter from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';

const router = new VueRouter({
  fallback: true,
  routes: setupLayouts(generatedRoutes)
});

export default router;
