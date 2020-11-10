<template>
  <v-app
    ref="loaderContainer"
    class="v-app"
    :style="{ visibility: loading ? 'visible' : 'hidden' }"
  >
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

export default Vue.extend({
  data() {
    return {
      loading: false,
      barColor: 'primary',
      indeterminate: true,
      barValue: 0,
      progress_timeout: 0
    };
  },
  methods: {
    set_default() {
      this.indeterminate = true;
      this.barColor = 'primary';
      this.barValue = 0;
    },
    start() {
      if (this.progress_timeout !== 0) {
        window.clearTimeout(this.progress_timeout);
      }
      this.loading = true;
      this.set_default();
    },
    finish() {
      this.set_default();
      // Ensure that the 'slide up' animation appears after loading finishes. Without this
      // the animation could be skipped due to DOM blocking.
      this.progress_timeout = window.setTimeout(
        () => (this.loading = false),
        50
      );
    },
    fail() {
      this.barColor = 'red';
      this.indeterminate = false;
      this.barValue = 100;
      this.loading = true;
    },
    increase(num: number) {
      this.barValue = num;
    }
  }
});
</script>
<style scoped>
.v-app {
  max-height: 4px !important;
  overflow: hidden !important;
  z-index: 10;
  visibility: hidden;
  position: sticky;
}
</style>
