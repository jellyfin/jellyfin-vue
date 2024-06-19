<template>
  <Backdrop />
  <VApp>
    <JApp>
      <RouterView v-slot="{ Component, route }">
        <JTransition
          :name="route.meta.layout.transition.enter ?? defaultTransition"
          :mode="defaultTransitionMode ?? route.meta.layout.transition.mode"
          important>
          <Suspense @resolve="apploaded = true">
            <JView
              :key="route.meta.layout.name ?? 'default'"
              :comp="getLayoutComponent(route.meta.layout.name)">
                <JTransition
                  :name="route.meta.layout.transition.enter ?? defaultTransition"
                  :mode="defaultTransitionMode ?? route.meta.layout.transition.mode"
                  important>
                  <Suspense suspensible>
                    <JView :key="route.path" :comp="Component" />
                  </Suspense>
                </JTransition>
            </JView>
            <template v-if="!apploaded" #fallback>
              <JSplashscreen />
            </template>
          </Suspense>
        </JTransition>
      </RouterView>
    </JApp>
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
import type { RouteMeta } from 'vue-router';
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';

const apploaded = shallowRef(false);
const defaultTransition = 'slide-x-reverse';
const defaultTransitionMode = 'out-in';

/**
 * When app is mounted, the classes and styles we initialized in the pre-Vue splashscreen in body
 * are now useless and can break the page if not removed.
 *
 * We set all the styles and vars in JApp, so we want a body with 0 styling attributes.
 */
onMounted(() => {
  document.body.removeAttribute('class');
  document.body.removeAttribute('style');
});

/**
 * Return the appropiate layout component according to the route's meta.layout property
 */
function getLayoutComponent(layout: RouteMeta['layout']['name']): VueComponent {
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
