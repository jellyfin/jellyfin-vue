<template>
  <div class="skeleton-card">
    <v-skeleton-loader type="image" />
    <v-skeleton-loader type="heading" class="mt-1" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>

<style>
.skeleton-card {
  margin: 0.6em;
}

.skeleton-card .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 150%;
  border-radius: 0.3em;
}

.skeleton-card .v-skeleton-loader .v-skeleton-loader__heading {
  width: 75%;
  margin: auto;
}
</style>
