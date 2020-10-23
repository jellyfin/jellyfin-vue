<template>
  <v-app ref="loaderContainer" class="v-app">
    <v-progress-linear
      :active="loading"
      :indeterminate="true"
      :height="4"
      :bottom="true"
      :rounded="true"
    ></v-progress-linear>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      loading: false
    };
  },
  methods: {
    start() {
      this.loading = true;
    },
    finish() {
      this.loading = false;
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
