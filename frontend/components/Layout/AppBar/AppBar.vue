<template>
  <v-app-bar
    clipped-left
    class="ml-n3 mr-n3 app-bar-safe-zone"
    flat
    app
    :class="{ opaque: page.opaqueAppBar }"
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
    <v-text-field
      v-model="searchQuery"
      class="search-input"
      :class="$vuetify.breakpoint.smAndUp ? 'expandable' : null"
      prepend-inner-icon="mdi-magnify"
      :placeholder="$t('search.name')"
      max-width="15em"
      dense
      outlined
      filled
      flat
      hide-details
      single-line
    />
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
    <cast-button
      :fab="
        !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
      "
    />
    <user-button />
    <locale-switcher
      :fab="
        !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
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
    ...mapStores(pageStore, clientSettingsStore),
    searchQuery: {
      get(): string {
        return this.$route.query.q?.toString();
      },
      set(value: string): void {
        if (value === '' || !value) {
          this.$router.back();
        } else if (this.searchQuery) {
          this.$router.replace({ path: '/search', query: { q: value } });
        } else {
          this.$router.push({ path: '/search', query: { q: value } });
        }
      }
    }
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

.v-app-bar:not(.v-app-bar--is-scrolled):not(.opaque) {
  background-color: transparent !important;
}

.search-input {
  max-width: 15em;
  transition: max-width 0.25s;
}

.search-input.expandable.primary--text {
  max-width: 40em;
  transition: max-width 0.25s;
}
</style>
