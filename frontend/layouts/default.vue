<template>
  <v-app>
    <backdrop />
    <navigation-drawer v-if="!$vuetify.breakpoint.mobile" />
    <app-bar />
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
  computed: {
    ...mapState('user', ['accessToken']),
    ...mapState('deviceProfile', ['deviceId'])
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
    ...mapActions('page', ['setIsScrolled']),
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
