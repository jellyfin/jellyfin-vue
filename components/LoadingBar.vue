<template>
  <v-progress-linear
    v-if="loading"
    class="ma-0"
    :indeterminate="true"
    :height="4"
    :bottom="true"
    :rounded="true"
    :absolute="true"
  ></v-progress-linear>
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
      console.log('loading');
      this.loading = true;
    },
    finish() {
      console.log('not loading');
      this.loading = false;
    }
  }
});
</script>
