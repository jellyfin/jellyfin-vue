<template>
  <v-row>
    <v-col cols="12" class="card-grid-container">
      <skeleton-card
        v-for="n in 24"
        :key="n"
        :card-shape="skeletonCardShape"
        text />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CardShapes, getShapeFromItemType } from '~/utils/items';

export default defineComponent({
  props: {
    viewType: {
      type: String,
      default: (): string => 'Movie'
    }
  },
  data() {
    return {
      skeletonCardShape: CardShapes.Portrait
    };
  },
  watch: {
    viewType(): void {
      this.setCardShape();
    }
  },
  created() {
    this.setCardShape();
  },
  methods: {
    setCardShape(): void {
      this.skeletonCardShape = getShapeFromItemType(this.viewType);
    }
  }
});
</script>

<style lang="scss" scoped>
.card-grid-container {
  display: grid;
}

// @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
//   .card-grid-container {
//     grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
//   }
// }

// @media #{map-get(settings.$display-breakpoints, 'sm-and-up')} {
//   .card-grid-container {
//     grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
//   }
// }

// @media #{map-get(settings.$display-breakpoints, 'lg-and-up')} {
//   .card-grid-container {
//     grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
//   }
// }

// @media #{map-get(settings.$display-breakpoints, 'xl-only')} {
//   .card-grid-container {
//     grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
//   }
// }
</style>
