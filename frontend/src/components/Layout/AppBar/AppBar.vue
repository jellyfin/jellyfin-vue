<template>
  <v-app-bar
    clipped-left
    class="app-bar-safe-zone"
    flat
    app
    elevate-on-scroll
    elevation="3"
    :hide-on-scroll="$vuetify.display.mobile"
    :class="{ transparent: transparentLayout && !page.isScrolled }">
    <v-app-bar-nav-icon
      v-if="$vuetify.display.mobile && page.navDrawer"
      @click.stop="page.openDrawer = !page.openDrawer" />
    <app-bar-button-layout
      v-hide="$route.name === 'index'"
      @click.native="$router.back()">
      <template #icon>
        <v-icon>mdi-arrow-left</v-icon>
      </template>
    </app-bar-button-layout>
    <v-spacer />
    <search-field />
    <v-spacer />
    <app-bar-button-layout v-if="network.isOnline" color="red">
      <template #icon>
        <v-icon>mdi-network-off-outline</v-icon>
      </template>
      <template #tooltip>
        <span>{{ $t('noNetworkConnection') }}</span>
      </template>
    </app-bar-button-layout>
    <task-manager-button />
    <app-bar-button-layout @click.native="toggleDarkMode">
      <template #icon>
        <v-icon>
          {{
            clientSettings.darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'
          }}
        </v-icon>
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
    <locale-switcher
      :fab="
        !(!transparentLayout || $vuetify.display.xsOnly) && !page.isScrolled
      " />
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useNetwork } from '@vueuse/core';
import { mapStores } from 'pinia';
import { useRoute } from 'vue-router';
import { clientSettingsStore } from '~/store';

export default defineComponent({
  setup() {
    const route = useRoute();

    const transparentLayout = computed(() => {
      return typeof route.meta.layout !== 'string' &&
        route.meta.layout?.transparent
        ? route.meta.layout.transparent
        : false;
    });

    return { transparentLayout };
  },
  data() {
    return {
      network: useNetwork()
    };
  },
  computed: {
    ...mapStores(clientSettingsStore)
  },
  methods: {
    toggleDarkMode(): void {
      this.clientSettings.setDarkMode(!this.clientSettings.darkMode);
    }
  }
});
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
