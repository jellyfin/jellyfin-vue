<template>
  <v-col>
    <!-- TODO: Wait for Vuetify 3.1 -->
    <!-- <v-skeleton-loader type="heading" max-width="25em" class="ml-2" /> -->
    <v-row class="space-around ma-0">
      <skeleton-card
        v-for="i in cardNumber"
        :key="i"
        :card-shape="cardShape"
        :style="`width: ${100 / cardNumber}%`"
        text />
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CardShapes } from '@/utils/items';

export default defineComponent({
  props: {
    cardShape: {
      type: String,
      validator: (value: string): boolean =>
        Object.values(CardShapes).includes(value as CardShapes),
      default: CardShapes.Thumb
    }
  },
  computed: {
    cardNumber(): number {
      if (this.$vuetify.display.width < 600) {
        return this.cardShape === CardShapes.Thumb ? 2 : 3;
      } else if (this.$vuetify.display.width < 960) {
        return this.cardShape === CardShapes.Thumb ? 3 : 4;
      } else if (this.$vuetify.display.width < 1264) {
        return this.cardShape === CardShapes.Thumb ? 3 : 6;
      } else if (this.$vuetify.display.width < 1904) {
        return this.cardShape === CardShapes.Thumb ? 4 : 8;
      }

      return 4;
    }
  }
});
</script>
