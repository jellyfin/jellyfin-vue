<template>
  <v-fab-transition>
    <v-btn
      v-show="isScrolled"
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
import { mapState } from 'vuex';

export default Vue.extend({
  computed: {
    ...mapState('page', ['isScrolled'])
  },
  methods: {
    scrollToTop(): void {
      window.scrollTo({ top: 0 });
    }
  }
});
</script>
