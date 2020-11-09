<template>
  <dynamic-scroller
    class="scroller"
    :items="items"
    :min-item-size="350"
    :buffer="$vuetify.breakpoint.height * 1.5"
    page-mode
  >
    <template v-slot="{ item, index, active }">
      <dynamic-scroller-item
        :item="item"
        :active="active"
        :data-index="index"
        :class="narrow ? 'narrow-card-grid-container' : 'card-grid-container'"
      >
        <card v-for="card of item.chunk" :key="card.Id" :item="card" />
      </dynamic-scroller-item>
    </template>
  </dynamic-scroller>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true,
      default: () => {
        return [];
      }
    },
    narrow: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';
.card-grid-container,
.narrow-card-grid-container {
  display: grid;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
  .narrow-card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 2), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
  .narrow-card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }
  .narrow-card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }
  .narrow-card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 6), 1fr));
  }
}
</style>
