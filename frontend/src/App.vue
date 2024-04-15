<template>
  <Backdrop />
  <VApp>
    <RouterView v-slot="{ Component, route }">
      <JTransition
        :name="route.meta.transition?.enter ?? defaultTransition"
        :mode="defaultTransitionMode">
        <Suspense @resolve="apploaded = true">
          <div
            :key="route.meta.layout"
            class="h-100 j-transition">
            <component
              :is="getLayoutComponent(route.meta.layout)"
              :key="route.meta.layout">
              <JTransition
                :name="route.meta.transition?.enter ?? defaultTransition"
                :mode="defaultTransitionMode">
                <Suspense suspensible>
                  <div
                    :key="route.name ?? route.path"
                    class="h-100 j-transition">
                    <component
                      :is="Component"
                      :key="route.name ?? route.path" />
                  </div>
                </Suspense>
              </JTransition>
            </component>
          </div>
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
import { whenever } from '@vueuse/core';
import { type Component as VueComponent, shallowRef } from 'vue';
import type { RouteMeta } from 'vue-router/auto';
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';

const apploaded = shallowRef(false);
const defaultTransition = 'slide-x-reverse';
const defaultTransitionMode = 'out-in';

/**
 * - SPLASHSCREEN REMOVAL -
 *
 * Without window.setTimeout and window.requestAnimationFrame, the
 * splash screen gets frozen an small (but noticeable) amount of time.
 *
 * Once we reach this point, all the async dependencies will be completely loaded and mounted,
 * so we add a loadFinished class (defined in index.html) that fires the defined transition
 * in the HTML markup to give a nice effect while hiding the splashscreen
 */
const stop = whenever(apploaded, () => {
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      const splashDOM = document.querySelector('.splashBackground');

      if (!splashDOM) {
        throw new Error('could not locate splash div in DOM');
      }

      splashDOM.addEventListener(
        'transitionend',
        () => {
          window.setTimeout(() => {
            window.requestAnimationFrame(() => {
              splashDOM.remove();
              stop();
            });
          });
        },
        { once: true }
      );

      splashDOM.classList.add('loadFinished');
    });
  });
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
