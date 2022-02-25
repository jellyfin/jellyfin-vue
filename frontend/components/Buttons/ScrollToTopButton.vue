<template>
  <v-fab-transition>
    <v-btn
      v-show="page.isScrolled"
      color="primary"
      fab
      dark
      bottom
      right
      fixed
      @click="scrollToTop"
    >
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </v-fab-transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default Vue.extend({
  methods: {
    scrollToTop(): void {
      window.scrollTo({ top: 0 });
    }
  },
  computed: {
    ...mapStores(pageStore)
  }
});
</script>
