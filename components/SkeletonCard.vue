<template>
  <div class="skeleton-card">
    <v-skeleton-loader type="image" :boilerplate="boilerplate" />
    <v-skeleton-loader
      v-if="!noText"
      type="heading"
      class="mt-1"
      :boilerplate="boilerplate"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    boilerplate: {
      type: Boolean,
      default: false
    },
    noText: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style scoped>
.skeleton-card {
  margin: 0.6em;
}

.skeleton-card >>> .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 150%;
  border-radius: 0.3em;
}

.skeleton-card >>> .v-skeleton-loader .v-skeleton-loader__heading {
  width: 75%;
  margin: auto;
}
</style>
