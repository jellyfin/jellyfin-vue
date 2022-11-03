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
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default defineComponent({
  computed: {
    ...mapStores(pageStore)
  },
  mounted() {
    window.addEventListener('scroll', this.setScroll, { passive: true });
  },
  unmounted() {
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
