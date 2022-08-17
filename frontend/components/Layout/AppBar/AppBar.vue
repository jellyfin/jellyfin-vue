<template>
  <v-app-bar
    clipped-left
    class="app-bar-safe-zone"
    flat
    app
    elevate-on-scroll
    elevation="3"
    :hide-on-scroll="$vuetify.breakpoint.mobile"
    :class="{ transparent: page.transparentLayout && !page.isScrolled }"
  >
    <v-app-bar-nav-icon
      v-if="$vuetify.breakpoint.mobile && page.navDrawer"
      @click.stop="page.openDrawer = !page.openDrawer"
    />
    <app-bar-button-layout
      v-hide="$route.name === 'index'"
      @click.native="$router.back()"
    >
      <template #icon>
        <v-icon>mdi-arrow-left</v-icon>
      </template>
    </app-bar-button-layout>
    <v-spacer />
    <search-field />
    <v-spacer />
    <app-bar-button-layout v-if="$nuxt.isOffline" color="red">
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
        !(!page.transparentLayout || $vuetify.breakpoint.xsOnly) &&
        !page.isScrolled
      "
    /> -->
    <user-button />
    <locale-switcher
      :fab="
        !(!page.transparentLayout || $vuetify.breakpoint.xsOnly) &&
        !page.isScrolled
      "
    />
  </v-app-bar>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { pageStore, clientSettingsStore } from '~/store';

export default Vue.extend({
  computed: {
    ...mapStores(pageStore, clientSettingsStore)
  },
  methods: {
    toggleDarkMode(): void {
      this.clientSettings.setDarkMode(!this.clientSettings.darkMode);
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.app-bar-safe-zone {
  height: calc(56px + env(safe-area-inset-top)) !important;
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .app-bar-safe-zone {
    height: calc(64px + env(safe-area-inset-top)) !important;
  }
}
.v-toolbar.ml-n3 {
  max-width: initial !important;
}
</style>
