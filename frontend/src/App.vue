<template>
  <Backdrop />
  <VApp>
    <RouterView v-slot="{ Component, route }">
      <JTransition
        :name="route.meta.transition?.enter ?? defaultTransition"
        :mode="defaultTransitionMode"
        :disabled="!mounted"
        appear>
        <Suspense @resolve="apploaded = true">
          <div
            :key="route.meta.layout"
            class="uno-h-full j-transition">
            <component
              :is="getLayoutComponent(route.meta.layout)"
              :key="route.meta.layout">
              <JTransition
                :name="route.meta.transition?.enter ?? defaultTransition"
                :mode="defaultTransitionMode">
                <Suspense suspensible>
                  <div
                    :key="route.name ?? route.path"
                    class="uno-h-full j-transition">
                    <component
                      :is="Component"
                      :key="route.name ?? route.path" />
                  </div>
                </Suspense>
              </JTransition>
            </component>
          </div>
          <template v-if="!apploaded" #fallback>
            <JSplashscreen />
          </template>
        </Suspense>
      </JTransition>
    </RouterView>
    <Snackbar />
    <ConfirmDialog />
  </VApp>
  <PlayerElement />
</template>

<script setup lang="ts">
/**
 * TODO: Remove j-transition classes from this file once https://github.com/vuejs/core/issues/5148 is fixed
 */
import { shallowRef, type Component as VueComponent, onMounted } from 'vue';
import type { RouteMeta } from 'vue-router/auto';
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';

const apploaded = shallowRef(false);
const mounted = shallowRef(false);
const defaultTransition = 'slide-x-reverse';
const defaultTransitionMode = 'out-in';

/**
 * When app is mounted, the classes we initialized in the pre-Vue splashscreen in body
 * are now useless and can break the page if not removed
 */
onMounted(() => {
  document.body.removeAttribute('class');
  mounted.value = true;
});

/**
 * Return the appropiate layout component according to the route's meta.layout property
 */
function getLayoutComponent(layout: RouteMeta['layout']): VueComponent {
  switch (layout) {
    case 'fullpage': {
      return FullPageLayout as VueComponent;
    }
    case 'server': {
      return ServerLayout as VueComponent;
    }
    default: {
      return DefaultLayout;
    }
  }
}
</script>
