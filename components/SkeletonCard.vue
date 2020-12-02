<template>
  <div :class="`skeleton-card ${cardShape}`">
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
    },
    cardShape: {
      type: String,
      default: () => 'portrait-card'
    }
  }
});
</script>

<style scoped>
.skeleton-card {
  margin: 0.6em;
}

.skeleton-card >>> .v-skeleton-loader .v-skeleton-loader__heading {
  width: 75%;
  margin: auto;
}

.skeleton-card.square-card >>> .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 100%;
  border-radius: 0.3em;
}

.skeleton-card.portrait-card >>> .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 150%;
  border-radius: 0.3em;
}

.skeleton-card.thumb-card >>> .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 56.25%;
  border-radius: 0.3em;
}
</style>
