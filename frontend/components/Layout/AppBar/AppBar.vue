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
      @click="$router.back()"
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

    <app-bar-button-layout @click="toggleDarkMode">
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
    ...mapState(['syncing'])
  },
  methods: {
    ...mapActions('clientSettings', ['setDarkMode']),
    toggleDarkMode(): void {
      this.setDarkMode({ darkMode: !this.darkMode });
    }
  }
});
</script>
