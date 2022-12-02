<template>
  <v-app-bar
    :class="useResponsiveClasses('app-bar-safe-zone')"
    flat
    elevation="3"
    :color="transparentLayout ? 'transparent' : 'background'">
    <v-app-bar-nav-icon
      v-if="$vuetify.display.mobile && navigationDrawer"
      @click="navigationDrawer = !navigationDrawer" />
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
    <app-bar-button-layout v-if="!network.isOnline" color="red">
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
          <i-mdi-weather-sunny v-if="clientSettings.darkMode" />
          <i-mdi-weather-night v-else />
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
import { computed, inject, Ref } from 'vue';
import { useRoute } from 'vue-router';
import { useNetwork } from '@vueuse/core';
import { clientSettingsStore } from '~/store';
import { useResponsiveClasses } from '@/composables';

const clientSettings = clientSettingsStore();
const route = useRoute();
const network = useNetwork();
const transparentLayout = computed<boolean>(() => {
  return route.meta.transparentLayout || false;
});

const navigationDrawer = inject<Ref<boolean>>('NavigationDrawer');

/**
 * Toggles dark mode settings
 */
function toggleDarkMode(): void {
  clientSettings.setDarkMode(!clientSettings.darkMode);
}
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
