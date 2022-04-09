<template>
  <v-app>
    <backdrop />
    <v-navigation-drawer
      v-if="page.navDrawer"
      v-model="drawer"
      :temporary="$vuetify.breakpoint.mobile"
      :permanent="!$vuetify.breakpoint.mobile"
      app
      class="pa-s"
    >
      <template #prepend>
        <user-button />
        <v-divider />
      </template>
      <v-list>
        <v-list-item
          v-for="item in items"
          :key="item.Id"
          :to="item.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
        <v-subheader>{{ $t('libraries') }}</v-subheader>
        <v-list-item
          v-for="library in libraryItems"
          :key="library.Id"
          :to="library.to"
          router
          exact
        >
          <v-list-item-action>
            <v-icon>{{ library.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="library.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <template #append>
        <connection-monitor />
        <syncing-monitor />
        <commit-link />
      </template>
    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="$vuetify.breakpoint.mobile"
      class="pt-s pl-2 pr-2 app-bar-safe-zone"
      flat
      app
      :class="{ opaque: page.opaqueAppBar || $vuetify.breakpoint.xsOnly }"
    >
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile && page.navDrawer"
        @click.stop="drawer = !drawer"
      />
      <v-btn
        v-hide="$route.name === 'index'"
        :icon="
          page.opaqueAppBar || $vuetify.breakpoint.xsOnly || page.isScrolled
        "
        :fab="
          !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
        "
        :small="
          !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
        "
        :class="{
          'ml-n1':
            page.opaqueAppBar || $vuetify.breakpoint.xsOnly || page.isScrolled,
          'mr-2':
            !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) &&
            !page.isScrolled,
          'mr-1':
            page.opaqueAppBar || $vuetify.breakpoint.xsOnly || page.isScrolled
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
        :fab="
          !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
        "
      />
      <locale-switcher
        :fab="
          !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
        "
        bottom
      />
      <cast-button
        :fab="
          !(page.opaqueAppBar || $vuetify.breakpoint.xsOnly) && !page.isScrolled
        "
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
import Vue from 'vue';
import { stringify } from 'qs';
import { mapStores } from 'pinia';
import {
  authStore,
  deviceProfileStore,
  socketStore,
  pageStore,
  userViewsStore
} from '~/store';
import settingsHelper from '~/mixins/settingsHelper';

interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}

export default Vue.extend({
  mixins: [settingsHelper],
  data() {
    return {
      drawer: false
    };
  },
  computed: {
    ...mapStores(
      authStore,
      deviceProfileStore,
      socketStore,
      pageStore,
      userViewsStore
    ),
    libraryItems() {
      return this.userViews.getNavigationDrawerItems;
    },
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
    },
    items(): LayoutButton[] {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    }
  },
  watch: {
    $route(to): void {
      if (to.fullPath.includes('fullscreen')) {
        this.page.navDrawer = false;
      } else if (!this.page.navDrawer) {
        this.page.navDrawer = true;
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
    this.userViews.refreshUserViews();
    this.connectToWebSocket();
  },
  mounted() {
    window.addEventListener('scroll', this.setScroll, { passive: true });
  },
  destroyed() {
    window.removeEventListener('scroll', this.setScroll);
  },
  methods: {
    setScroll(): void {
      // Set it slightly higher than needed, so the transition of the app bar syncs with the button transition
      this.page.isScrolled = window.scrollY > 10;
    },
    connectToWebSocket(): void {
      const socketParams = stringify({
        api_key: this.auth.getCurrentUserAccessToken,
        deviceId: this.deviceProfile.deviceId
      });
      let url = `${this.$axios.defaults.baseURL}/socket?${socketParams}`;

      url = url.replace('https:', 'wss:');
      url = url.replace('http:', 'ws:');
      this.socket.connect(url);
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
