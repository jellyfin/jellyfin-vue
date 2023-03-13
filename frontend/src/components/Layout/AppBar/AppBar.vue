<template>
  <v-app-bar
    :class="useResponsiveClasses('app-bar-safe-zone')"
    :elevation="transparentAppBar ? 0 : 3"
    :color="transparentAppBar ? 'transparent' : undefined">
    <v-app-bar-nav-icon
      v-if="$vuetify.display.mobile"
      @click="navigationDrawer = !navigationDrawer" />
    <app-bar-button-layout @click="$router.back()">
      <template #icon>
        <v-icon>
          <i-mdi-arrow-left />
        </v-icon>
      </template>
    </app-bar-button-layout>
    <v-spacer />
    <search-field />
    <v-spacer />
    <app-bar-button-layout v-if="!network.isOnline" color="red">
      <template #icon>
        <v-icon>
          <i-mdi-network-off-outline />
        </v-icon>
      </template>
      <template #tooltip>
        <span>{{ $t('noNetworkConnection') }}</span>
      </template>
    </app-bar-button-layout>
    <task-manager-button />
    <app-bar-button-layout @click="switchColorTheme">
      <template #icon>
        <v-icon>
          <i-mdi-brightness-auto v-if="clientSettings.darkMode === 'auto'" />
          <i-mdi-weather-sunny v-else-if="clientSettings.darkMode" />
          <i-mdi-weather-night v-else />
        </v-icon>
      </template>
      <template #tooltip>
        <span v-if="clientSettings.darkMode === 'auto'">
          {{ $t('tooltips.switchToDarkMode') }}
        </span>
        <span v-else-if="clientSettings.darkMode">
          {{ $t('tooltips.switchToLightMode') }}
        </span>
        <span v-else>
          {{ $t('tooltips.switchToAuto') }}
        </span>
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
    <locale-switcher elevated />
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed, inject, Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNetwork, useWindowScroll } from '@vueuse/core';
import { clientSettingsStore } from '@/store';
import { useResponsiveClasses } from '@/composables';

const clientSettings = clientSettingsStore();
const route = useRoute();
const network = useNetwork();
const { y } = useWindowScroll();
const transparentAppBar = computed<boolean>(() => {
  return (route.meta.transparentLayout || false) && y.value < 10;
});

/**
 * Cycle between the different color schemas
 */
function switchColorTheme(): void {
  if (clientSettings.darkMode === 'auto') {
    clientSettings.darkMode = true;
  } else if (clientSettings.darkMode) {
    clientSettings.darkMode = false;
  } else {
    clientSettings.darkMode = 'auto';
  }
}

const navigationDrawer = inject<Ref<boolean>>('NavigationDrawer');
</script>

<style lang="scss" scoped>
.app-bar-safe-zone {
  height: calc(56px + env(safe-area-inset-top));
}

.app-bar-safe-zone.md-and-up {
  height: calc(64px + env(safe-area-inset-top)) !important;
}

.v-toolbar.ml-n3 {
  max-width: initial !important;
}
</style>
