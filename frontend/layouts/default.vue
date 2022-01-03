<template>
  <v-app>
    <backdrop />
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
      <v-btn
        v-hide="$route.name === 'index'"
        :icon="opaqueAppBar || $vuetify.breakpoint.xsOnly || isScrolled"
        :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
        :small="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
        :class="{
          'ml-n1': opaqueAppBar || $vuetify.breakpoint.xsOnly || isScrolled,
          'mr-2': !(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled,
          'mr-1': opaqueAppBar || $vuetify.breakpoint.xsOnly || isScrolled
        }"
        @click="$router.back()"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
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
      <dark-mode-toggle
        :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
      />
      <locale-switcher
        :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
        bottom
      />
      <cast-button
        :fab="!(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled"
      />
    </v-app-bar>
    <v-main>
      <div class="pa-s">
        <nuxt />
      </div>
    </v-main>
    <audio-controls />
    <!-- Utilities and global systems -->
    <snackbar />
    <player-manager />
  </v-app>
</template>

<script lang="ts">
import { stringify } from 'qs';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import settingsHelper from '~/mixins/settingsHelper';

export default Vue.extend({
  mixins: [settingsHelper],
  data() {
    return {
      drawer: false
    };
  },
  computed: {
    ...mapState('page', ['opaqueAppBar', 'navDrawer', 'isScrolled']),
    ...mapState('user', ['accessToken']),
    ...mapState('deviceProfile', ['deviceId']),
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
  watch: {
    $route(to): void {
      if (to.fullPath.includes('fullscreen')) {
        this.showNavDrawer({ showNavDrawer: false });
      } else if (!this.navDrawer) {
        this.showNavDrawer({ showNavDrawer: true });
      }
    },
    '$vuetify.breakpoint.mobile': {
      immediate: true,
      handler(newVal: boolean): void {
        if (newVal === true) {
          this.drawer = false;
        }
      }
    }
  },
  beforeMount() {
    this.refreshUserViews();
    this.connectToWebSocket();
  },
  mounted() {
    window.addEventListener('scroll', this.setScroll, { passive: true });
  },
  destroyed() {
    window.removeEventListener('scroll', this.setScroll);
  },
  methods: {
    ...mapActions('userViews', ['refreshUserViews']),
    ...mapActions('page', ['showNavDrawer', 'setIsScrolled']),
    ...mapActions('search', ['setSearchQuery']),
    ...mapActions('socket', ['connectSocket']),
    setScroll(): void {
      // Set it slightly higher than needed, so the transition of the app bar syncs with the button transition
      this.setIsScrolled({ scrolled: window.scrollY > 10 });
    },
    connectToWebSocket(): void {
      const socketParams = stringify({
        api_key: this.accessToken,
        deviceId: this.deviceId
      });
      let url = `${this.$axios.defaults.baseURL}/socket?${socketParams}`;

      url = url.replace('https:', 'wss:');
      url = url.replace('http:', 'ws:');

      this.connectSocket({ url });
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
