<template>
  <v-app-bar
    class="app-bar-safe-zone"
    flat
    elevation="3"
    :class="{ transparent: transparentLayout }">
    <v-app-bar-nav-icon v-if="$vuetify.display.mobile" />
    <app-bar-button-layout v-hide="$route.path === '/'" @click="$router.back()">
      <template #icon>
        <Icon>
          <i-mdi-arrow-left />
        </Icon>
      </template>
    </app-bar-button-layout>
    <v-spacer />
    <search-field />
    <v-spacer />
    <app-bar-button-layout v-if="network.isOnline" color="red">
      <template #icon>
        <Icon>
          <i-mdi-network-off-outline />
        </Icon>
      </template>
      <template #tooltip>
        <span>{{ $t('noNetworkConnection') }}</span>
      </template>
    </app-bar-button-layout>
    <task-manager-button />
    <app-bar-button-layout @click="toggleDarkMode">
      <template #icon>
        <Icon>
          {{ clientSettings.darkMode ? IMdiWeatherSunny : IMdiWeatherNight }}
        </Icon>
      </template>
      <template #tooltip>
        <span>{{
          clientSettings.darkMode
            ? $t('tooltips.switchToLightMode')
            : $t('tooltips.switchToDarkMode')
        }}</span>
      </template>
    </app-bar-button-layout>
    <!-- Uncomment when some of the remote play features are fully implemented -->
    <!-- <cast-button
      :fab="
        !(!transparentLayout || $vuetify.display.xsOnly) &&
        !page.isScrolled
      "
    /> -->
    <user-button />
    <locale-switcher />
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useNetwork } from '@vueuse/core';
import { clientSettingsStore } from '~/store';
import IMdiWeatherSunny from '~icons/mdi/weather-sunny';
import IMdiWeatherNight from '~icons/mdi/weather-night';

const clientSettings = clientSettingsStore();
const route = useRoute();
const network = useNetwork();
const transparentLayout = computed<boolean>(() => {
  return route.meta.transparentLayout || false;
});

/**
 * Toggles dark mode settings
 */
function toggleDarkMode(): void {
  clientSettings.setDarkMode(!clientSettings.darkMode);
}
</script>

<style lang="scss" scoped>
.app-bar-safe-zone {
  height: calc(56px + env(safe-area-inset-top)) !important;
}

// @media #{map-get($display-breakpoints, 'md-and-up')} {
//   .app-bar-safe-zone {
//     height: calc(64px + env(safe-area-inset-top)) !important;
//   }
// }
.v-toolbar.ml-n3 {
  max-width: initial !important;
}
</style>
