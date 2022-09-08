import { createRouter, createWebHistory } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from '~pages';

const router = createRouter({
  history: createWebHistory(),
  routes: setupLayouts(generatedRoutes)
});

export default router;
