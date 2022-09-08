<template>
  <v-app>
    <backdrop />
    <navigation-drawer />
    <app-bar />
    <v-main>
      <div class="pa-s">
        <router-view />
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
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default Vue.extend({
  computed: {
    ...mapStores(pageStore)
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
      this.page.isScrolled = window.scrollY > 1;
    }
  }
});
</script>
