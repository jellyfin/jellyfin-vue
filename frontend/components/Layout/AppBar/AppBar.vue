<template>
  <v-app-bar
    :clipped-left="$vuetify.breakpoint.mobile"
    class="pt-s pl-2 pr-2 app-bar-safe-zone"
    flat
    app
    :class="{ opaque: opaqueAppBar || $vuetify.breakpoint.xsOnly }"
  >
    <v-app-bar-nav-icon
      v-if="$vuetify.breakpoint.mobile && navDrawer"
      @click.stop="drawer = !drawer"
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
    <app-bar-button-layout v-if="!$nuxt.isOffline" :color="'red'">
      <template #icon>
        <v-icon>mdi-network-off-outline</v-icon>
      </template>
      <template #tooltip>
        <span>{{ $t('noNetworkConnection') }}</span>
      </template>
    </app-bar-button-layout>
    <!-- Syncing monitor -->
    <app-bar-button-layout v-if="!syncing">
      <template #icon>
        <v-progress-circular indeterminate size="24" />
      </template>
      <template #tooltip>
        <span>{{ $t('syncingInProgress') }}</span>
      </template>
    </app-bar-button-layout>

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
.v-app-bar:not(.v-app-bar--is-scrolled):not(.opaque) {
  background-color: transparent !important;
}

.v-app-bar .v-app-bar--is-scrolled:not(.opaque) {
  padding-top: 0;
  padding-bottom: 0;
  background-color: rgba(32, 32, 32, 1) !important;
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
