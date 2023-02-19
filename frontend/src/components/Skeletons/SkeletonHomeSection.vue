<template>
  <v-col>
    <!-- TODO: Wait for Vuetify 3 implementation (https://github.com/vuetifyjs/vuetify/issues/13504) -->
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

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { CardShapes } from '@/utils/items';

const props = withDefaults(
  defineProps<{
    cardShape?: CardShapes;
  }>(),
  {
    cardShape: CardShapes.Thumb
  }
);

const cardNumber = computed((): number => {
  const { width } = useDisplay();

  if (width.value < 600) {
    return props.cardShape === CardShapes.Thumb ? 2 : 3;
  } else if (width.value < 960) {
    return props.cardShape === CardShapes.Thumb ? 3 : 4;
  } else if (width.value < 1264) {
    return props.cardShape === CardShapes.Thumb ? 3 : 6;
  } else if (width.value < 1904) {
    return props.cardShape === CardShapes.Thumb ? 4 : 8;
  }

  return 4;
});
</script>
