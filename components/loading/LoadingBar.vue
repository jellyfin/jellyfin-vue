<template>
  <v-app ref="loaderContainer" class="v-app">
    <v-progress-linear
      :active="loading"
      :indeterminate="indeterminate"
      :height="4"
      :bottom="true"
      :rounded="true"
      :color="barColor"
      :value="barValue"
    ></v-progress-linear>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

let timeout: number;
export default Vue.extend({
  data() {
    return {
      loading: false,
      barColor: 'primary',
      indeterminate: true,
      barValue: 0
    };
  },
  methods: {
    start() {
      window.clearTimeout(timeout);
      this.loading = true;
      this.indeterminate = true;
      this.barColor = 'primary';
      this.barValue = 0;
    },
    finish() {
      this.indeterminate = true;
      this.barColor = 'primary';
      this.barValue = 0;
      // Ensure that the 'slide up' animation appears after loading finishes. Without this
      // the animation could be skipped due to DOM blocking.
      timeout = window.setTimeout(() => (this.loading = false), 50);
    },
    fail() {
      this.barColor = 'red';
      this.indeterminate = false;
      this.barValue = 30;
      this.loading = true;
    }
  }
});
</script>
<style scoped>
.v-app {
  max-height: 4px !important;
  overflow: hidden !important;
  z-index: 10;
}
</style>
