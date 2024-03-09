<template>
  <Backdrop />
  <VApp>
    <RouterView v-slot="{ Component, route }">
      <TransitionView>
        <Suspense @resolve="apploaded = true">
          <div
            :key="route.meta.layout"
            style="transform-origin: center"
            class="h-100">
            <component
              :is="getLayoutComponent(route.meta.layout)"
              :key="route.meta.layout">
              <TransitionView>
                <Suspense suspensible>
                  <div
                    :key="route.path"
                    style="transform-origin: center"
                    class="h-100">
                    <component
                      :is="Component"
                      :key="route.path" />
                  </div>
                </Suspense>
              </TransitionView>
            </component>
          </div>
        </Suspense>
      </TransitionView>
    </RouterView>
    <Snackbar />
    <ConfirmDialog />
  </VApp>
  <PlayerElement />
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { ref, type Component as VueComponent } from 'vue';
import type { RouteMeta } from 'vue-router/auto';
import DefaultLayout from '@/layouts/default.vue';
import FullPageLayout from '@/layouts/fullpage.vue';
import ServerLayout from '@/layouts/server.vue';

const apploaded = ref(false);

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
