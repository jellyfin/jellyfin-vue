<template>
  <v-col v-if="relatedItems" class="related-items">
    <h1 class="text-h5">
      <span>{{ $t('moreLikeThis') }}</span>
    </h1>
    <vueper-slides
      :bullets="false"
      :bullets-outside="false"
      :arrows-outside="false"
      :visible-slides="8"
      :slide-multiple="true"
      :breakpoints="breakpoints"
      fixed-height="true"
    >
      <vueper-slide v-for="item in relatedItems" :key="item.Id">
        <template v-slot:content>
          <card :item="item" />
        </template>
      </vueper-slide>

      <template v-slot:arrow-left>
        <v-btn icon large>
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>

      <template v-slot:arrow-right>
        <v-btn icon large>
          <v-icon>mdi-arrow-right</v-icon>
        </v-btn>
      </template>
    </vueper-slides>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    /**
     * itemId To be used to get related items
     */
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      relatedItems: [] as BaseItemDto[],
      /**
       * Stores Breakpoints for number of visible slides
       * on different screen sizes
       */
      breakpoints: {
        600: {
          visibleSlides: 3
        },
        960: {
          visibleSlides: 4
        },
        1264: {
          visibleSlides: 6
        },
        1904: {
          visibleSlides: 8
        }
      }
    };
  },
  /**
   * Gets related items to be rendered
   */
  async beforeMount() {
    try {
      const RelatedItems = (
        await this.$libraryApi.getSimilarItems({
          itemId: this.id,
          userId: this.$auth.user.Id,
          limit: 16
        })
      ).data.Items as BaseItemDto[];

      this.relatedItems = RelatedItems;
    } catch (error) {
      console.error('Unable to get related items:', error);
    }
  }
});
</script>

<style>
.related-items .vueperslides__track {
  position: relative;
  cursor: default !important;
}

@media (hover: none) {
  .related-items .vueperslides__arrows {
    display: none !important;
  }
}

.related-items .vueperslides__arrows {
  display: flex;
  position: absolute;
  top: -2.75em;
  right: 0;
  align-items: center;
}

.related-items .vueperslides__arrow {
  position: relative;
  display: inline-flex;
  transform: none;
}

.related-items .vueperslides__arrow--prev {
  margin-right: 0.75em;
}
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::after,
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::before {
  box-shadow: none;
}
</style>
