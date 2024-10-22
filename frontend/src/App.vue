<template>
  <Backdrop />
  <VApp>
    <JApp>
      <RouterView v-slot="{ Component, route }">
        <JView
          :comp="Component"
          :route="route" />
      </RouterView>
    </JApp>
    <Snackbar />
    <ConfirmDialog />
  </VApp>
  <PlayerElement />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

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
</script>
