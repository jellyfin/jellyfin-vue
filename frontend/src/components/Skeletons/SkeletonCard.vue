<template>
  <div :class="`skeleton-card ${cardShape}`">
    <!-- TODO: Wait for Vuetify 3.1 -->
    <!-- <v-skeleton-loader type="image" :boilerplate="boilerplate" />
    <v-skeleton-loader
      v-if="text"
      type="heading"
      class="mt-1"
      :boilerplate="boilerplate"
    /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CardShapes } from '~/utils/items';

export default defineComponent({
  props: {
    boilerplate: {
      type: Boolean,
      default: false
    },
    text: {
      type: Boolean,
      default: false
    },
    cardShape: {
      type: String,
      default: (): string => CardShapes.Portrait,
      validator: (value): boolean =>
        Object.values(CardShapes).includes(value as CardShapes)
    }
  }
});
</script>

<style lang="scss" scoped>
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
