<template>
  <Backdrop />
  <Suspense @resolve="apploaded = true">
    <VApp>
      <RootView />
      <Snackbar />
      <ConfirmDialog />
    </VApp>
  </Suspense>
  <PlayerElement />
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core';
import { ref } from 'vue';

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
</script>
