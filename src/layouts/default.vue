<template>
  <v-app>
    <client-only>
      <backdrop />
    </client-only>
    <v-navigation-drawer
      v-if="navDrawer"
      v-model="drawer"
      clipped
      :permanent="!$vuetify.breakpoint.mobile"
      :mini-variant="!$vuetify.breakpoint.mobile && mini"
      mini-variant-width="68"
      app
      class="pa-s"
    >
      <v-list class="py-0">
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
        <v-subheader v-if="!mini">{{ $t('libraries') }}</v-subheader>
        <v-divider v-else />
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
      </template>
    </v-navigation-drawer>
    <v-app-bar
      class="pt-s pl-2 pr-2 app-bar-safe-zone"
      outlined
      clipped-left
      flat
      app
    >
      <v-app-bar-nav-icon
        :class="{ 'mr-2': !$vuetify.breakpoint.mobile }"
        @click.stop="onNavIconClick()"
      />
      <img
        v-if="!$vuetify.breakpoint.mobile"
        :src="logo"
        class="mr-2"
        :style="{ height: '40px' }"
      />
      <v-btn
        v-hide="$route.name === 'index'"
        icon
        :class="{
          'ml-n1': opaqueAppBar || $vuetify.breakpoint.xsOnly || isScrolled,
          'mr-2': !(opaqueAppBar || $vuetify.breakpoint.xsOnly) && !isScrolled,
          'mr-1': opaqueAppBar || $vuetify.breakpoint.xsOnly || isScrolled
        }"
        @click="$router.back()"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div
        :style="{
          width: '30em'
        }"
      >
        <v-text-field
          v-if="!$vuetify.breakpoint.mobile"
          v-model="searchQuery"
          class="search-input"
          prepend-inner-icon="mdi-magnify"
          :placeholder="$t('search.name')"
          dense
          outlined
          filled
          flat
          hide-details
          single-line
        />
      </div>
      <v-spacer />
      <dark-mode-toggle />
      <locale-switcher bottom />
      <cast-button />
      <user-button />
    </v-app-bar>
    <v-main>
      <div class="pa-s">
        <nuxt keep-alive :keep-alive-props="keepAliveOptions" />
      </div>
    </v-main>
    <audio-controls />
    <!-- Utilities and global systems -->
    <snackbar />
    <player-manager />
  </v-app>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import { stringify } from 'qs';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import { AppState } from '~/store';
import { getLibraryIcon } from '~/utils/items';
import settingsHelper from '~/mixins/settingsHelper';

interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}

export default Vue.extend({
  mixins: [settingsHelper],
  props: {
    keepAliveOptions: {
      type: Object as () => Record<string, unknown>,
      default: (): Record<string, unknown> => {
        return {
          max: 10,
          exclude: ['fullscreen-playback']
        };
      }
    }
  },
  data() {
    return {
      isScrolled: false,
      drawer: false,
      mini: true
    };
  },
  computed: {
    ...mapState<AppState>({
      libraryItems: (state: AppState) =>
        state.userViews.views.map((view: BaseItemDto) => {
          return {
            icon: getLibraryIcon(view.CollectionType),
            title: view.Name,
            to: `/library/${view.Id}`
          };
        })
    }),
    ...mapState('page', ['opaqueAppBar', 'navDrawer']),
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
    },
    items(): LayoutButton[] {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    },
    logo(): string {
      if (this.$vuetify.theme.dark) {
        return process.env.NODE_ENV === 'development'
          ? '/banner-dev-dark.svg'
          : '/banner-dark.svg';
      }

      return process.env.NODE_ENV === 'development'
        ? '/banner-dev-light.svg'
        : '/banner-light.svg';
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

    const socketParams = stringify({
      api_key: this.accessToken,
      deviceId: this.deviceId
    });
    let socketUrl = `${this.$axios.defaults.baseURL}/socket?${socketParams}`;

    socketUrl = socketUrl.replace('https:', 'wss:');
    socketUrl = socketUrl.replace('http:', 'ws:');

    this.$connect(socketUrl);
  },
  activated() {
    window.addEventListener('scroll', this.setIsScrolled, { passive: true });
  },
  deactivated() {
    window.removeEventListener('scroll', this.setIsScrolled);
  },
  methods: {
    ...mapActions('userViews', ['refreshUserViews']),
    ...mapActions('page', ['showNavDrawer']),
    ...mapActions('search', ['setSearchQuery']),
    setIsScrolled(): void {
      // Set it slightly higher than needed, so the transition of the app bar syncs with the button transition
      this.isScrolled = window.scrollY > 10;
    },
    onNavIconClick(): void {
      if (this.$vuetify.breakpoint.mobile) {
        this.drawer = !this.drawer;
      } else {
        this.mini = !this.mini;
      }
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
</style>
