<template>
  <v-app ref="app">
    <backdrop />
    <v-navigation-drawer
      v-model="drawer"
      :temporary="$vuetify.breakpoint.mobile"
      app
    >
      <template #prepend>
        <div class="d-flex align-center full-width pa-6">
          <user-button />
          <connection-monitor class="ml-auto" />
        </div>
        <v-divider></v-divider>
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
          v-for="library in getNavigationDrawerItems"
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
        <v-list>
          <v-list-item>
            <dark-mode-toggle />
          </v-list-item>
          <v-list-item
            v-for="(item, i) in configItems"
            :key="i"
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
        </v-list>
      </template>
    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="$vuetify.breakpoint.mobile"
      class="pl-2 pr-2"
      flat
      app
      :class="{ opaque: opaqueAppBar }"
    >
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile"
        @click.stop="drawer = !drawer"
      />
      <v-btn
        v-if="$route.name !== 'index'"
        class="mr-2"
        icon
        @click="$router.back()"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-text-field
        class="search-input"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search"
        max-width="15em"
        dense
        outlined
        filled
        flat
        hide-details
        single-line
      />
      <v-spacer />
      <locale-switcher class="mr-2" />
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>
    <!-- Utilities and global systems -->
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import { stringify } from 'qs';
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import { AppState } from '~/store';

interface WebSocketMessage {
  MessageType: string;
  Data?: Record<string, never>;
}

export default Vue.extend({
  data() {
    return {
      drawer: true,
      opacity: 0,
      keepAliveInterval: undefined as number | undefined
    };
  },
  computed: {
    ...mapState<AppState>({
      opaqueAppBar: (state: AppState) => state.page.opaqueAppBar
    }),
    items() {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    },
    configItems() {
      return [
        {
          icon: 'mdi-cog',
          title: this.$t('settings'),
          to: '/settings'
        }
      ];
    }
  },
  beforeMount() {
    this.callAllCallbacks();
    this.refreshUserViews();

    const socketParams = stringify({
      api_key: this.$store.state.user.accessToken,
      deviceId: this.$store.state.deviceProfile.deviceId
    });
    let socketUrl = `${this.$axios.defaults.baseURL}/socket?${socketParams}`;
    socketUrl = socketUrl.replace('https:', 'wss:');
    socketUrl = socketUrl.replace('http:', 'ws:');

    this.$connect(socketUrl);
    this.handleKeepAlive();
  },
  beforeDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
  },
  methods: {
    ...mapActions('userViews', ['refreshUserViews']),
    ...mapActions('displayPreferences', ['callAllCallbacks']),
    ...mapGetters('userViews', ['getNavigationDrawerItems']),
    handleKeepAlive(): void {
      this.$store.subscribe((mutation, state) => {
        if (
          mutation.type === 'SOCKET_ONMESSAGE' &&
          state.socket.message.MessageType === 'ForceKeepAlive'
        ) {
          this.sendWebSocketMessage('KeepAlive');
          this.keepAliveInterval = window.setInterval(() => {
            this.sendWebSocketMessage('KeepAlive');
          }, state.socket.message.Data * 1000 * 0.5);
        }
      });
    },
    sendWebSocketMessage(name: string, data?: Record<string, never>): void {
      const msg: WebSocketMessage = {
        MessageType: name,
        ...(data ? { Data: data } : {})
      };

      this.$store.state.socket.instance.send(JSON.stringify(msg));
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
}
</style>
