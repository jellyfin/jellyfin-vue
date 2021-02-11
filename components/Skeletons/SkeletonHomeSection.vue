<template>
  <v-col>
    <v-skeleton-loader type="heading" max-width="25em" />
    <v-row class="space-around ma-0">
      <skeleton-card
        v-for="i in cardNumber"
        :key="i"
        :card-shape="cardShape"
        :style="`width: ${100 / cardNumber}%`"
        text
      />
    </v-row>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    cardShape: {
      type: String,
      validator: (val): boolean =>
        ['thumb-card', 'portrait-card', 'square-card'].includes(val),
      default: 'thumb-card'
    }
  },
  computed: {
    cardNumber(): number {
      if (this.$vuetify.breakpoint.width < 600) {
        return this.cardShape === 'thumb-card' ? 2 : 3;
      } else if (this.$vuetify.breakpoint.width < 960) {
        return this.cardShape === 'thumb-card' ? 3 : 4;
      } else if (this.$vuetify.breakpoint.width < 1264) {
        return this.cardShape === 'thumb-card' ? 3 : 6;
      } else if (this.$vuetify.breakpoint.width < 1904) {
        return this.cardShape === 'thumb-card' ? 4 : 8;
      }
      return 4;
    }
  }
});
</script>
