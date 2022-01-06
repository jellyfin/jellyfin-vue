<template>
  <v-app-bar
    clipped-left
    class="ml-n3 mr-n3 app-bar-safe-zone"
    flat
    app
    elevate-on-scroll
    elevation="3"
    :hide-on-scroll="$vuetify.breakpoint.mobile"
    :class="{ opaque: opaqueAppBar }"
  >
    <app-bar-button-layout
      v-hide="$route.name === 'index'"
      @click.native="$router.back()"
    >
      <template #icon>
        <v-icon>mdi-arrow-left</v-icon>
      </template>
    </app-bar-button-layout>
    <v-spacer />
    <app-bar-button-layout v-if="!$nuxt.isOffline" :color="'red'">
      <template #icon>
        <v-icon>mdi-network-off-outline</v-icon>
      </template>
      <template #tooltip>
        <span>{{ $t('noNetworkConnection') }}</span>
      </template>
    </app-bar-button-layout>
    <progress-button />
    <app-bar-button-layout @click.native="toggleDarkMode">
      <template #icon>
        <v-icon>
          {{ darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
        </v-icon>
      </template>
      <template #tooltip>
        <span>{{
          darkMode
            ? $t('tooltips.switchToLightMode')
            : $t('tooltips.switchToDarkMode')
        }}</span>
      </template>
    </app-bar-button-layout>
    <app-bar-button-layout>
      <template #icon>
        <v-icon> mdi-magnify </v-icon>
      </template>
      <template #tooltip>
        <span>{{ $t('search.name') }}</span>
      </template>
    </app-bar-button-layout>
    <cast-button
      :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
    />
    <user-button />
    <locale-switcher
      :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
      bottom
    />
  </v-app-bar>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  computed: {
    ...mapState('page', ['opaqueAppBar', 'isScrolled']),
    ...mapState('clientSettings', ['darkMode']),
    ...mapState(['syncing']),
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
    ...mapActions('clientSettings', ['setDarkMode']),
    ...mapActions('search', ['setSearchQuery']),
    toggleDarkMode(): void {
      this.setDarkMode({ darkMode: !this.darkMode });
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
