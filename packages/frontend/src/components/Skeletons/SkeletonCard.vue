<template>
  <div :class="`skeleton-card ${cardShape}`">
    <!-- TODO: Wait for Vuetify 3 implementation (https://github.com/vuetifyjs/vuetify/issues/13504) -->
    <!-- <v-skeleton-loader type="image" :boilerplate="boilerplate" />
    <v-skeleton-loader
      v-if="text"
      type="heading"
      class="mt-1"
      :boilerplate="boilerplate"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { CardShapes } from '#/utils/items';

const { boilerplate, text, cardShape = CardShapes.Portrait } = defineProps<{
  boilerplate?: boolean;
  text?: boolean;
  cardShape?: CardShapes;
}>();
</script>

<style scoped>
.skeleton-card {
  padding: 0.6em;
}

.skeleton-card > .v-skeleton-loader .v-skeleton-loader__heading {
  width: 75%;
  margin: auto;
}

.skeleton-card.square-card > .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 100%;
  height: auto;
  border-radius: 0.3em;
}

.skeleton-card.portrait-card > .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 150%;
  height: auto;
  border-radius: 0.3em;
}

.skeleton-card.thumb-card > .v-skeleton-loader .v-skeleton-loader__image {
  padding-bottom: 56.25%;
  height: auto;
  border-radius: 0.3em;
}
</style>
