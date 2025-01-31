<template>
  <Backdrop />
  <VApp>
    <JApp
      :theme
      :loading>
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
import { computed } from 'vue';
import { themeSettings } from '#/store/settings/theme';
import { useLoading } from '#/composables/use-loading';

/**
 * When app is mounted, the classes and styles we initialized in the pre-Vue splashscreen in body
 * are now useless and can break the page if not removed.
 *
 * We set all the styles and vars in JApp, so we want a body with 0 styling attributes.
 */
document.body.removeAttribute('class');
document.body.removeAttribute('style');

const { isLoading: loading } = useLoading();
const theme = computed(() => ({
  isDark: themeSettings.currentThemeIsDark.value,
  colors: themeSettings.colors.value,
  typography: themeSettings.currentTypography.value,
  transitionDuration: themeSettings.transitionDuration.value
}));
</script>
