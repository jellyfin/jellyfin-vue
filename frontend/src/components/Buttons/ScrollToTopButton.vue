<template>
  <v-fab-transition>
    <v-btn
      v-show="page.isScrolled"
      color="primary"
      fab
      dark
      location="bottom"
      location="right"
      fixed
      @click="scrollToTop">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </v-fab-transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { pageStore } from '~/store';

export default defineComponent({
  computed: {
    ...mapStores(pageStore)
  },
  methods: {
    scrollToTop(): void {
      window.scrollTo({ top: 0 });
    }
  }
});
</script>
