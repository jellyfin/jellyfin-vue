<template>
  <v-app>
    <client-only>
      <backdrop />
    </client-only>
    <v-navigation-drawer
      v-if="navDrawer"
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
      </template>
    </v-navigation-drawer>
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
        class="search-input"
        :class="$vuetify.breakpoint.mdAndUp ? 'expandable' : null"
        prepend-inner-icon="mdi-magnify"
        :placeholder="$t('search')"
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
      drawer: false
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
    setIsScrolled(): void {
      // Set it slightly higher than needed, so the transition of the app bar syncs with the button transition
      this.isScrolled = window.scrollY > 10;
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
