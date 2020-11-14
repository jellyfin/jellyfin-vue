<template>
  <div v-if="relatedItems.length > 0">
    <div v-if="!vertical" class="related-items">
      <h1 class="text-h5 mb-2 ml-2 header">
        <span>{{ $t('youMayAlsoLike') }}</span>
      </h1>
      <vueper-slides
        :bullets="false"
        :bullets-outside="false"
        :arrows-outside="false"
        :visible-slides="6"
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
    </div>
    <div v-if="vertical">
      <h2 v-if="relatedItems.length > 0">{{ $t('youMayAlsoLike') }}</h2>
      <v-skeleton-loader v-else type="heading" />
      <v-list color="transparent" two-line>
        <div v-if="relatedItems.length > 0">
          <v-list-item
            v-for="relatedItem in relatedItems"
            :key="relatedItem.Id"
            nuxt
            :to="`/item/${relatedItem.Id}`"
          >
            <v-list-item-avatar>
              <lazy-image
                :src="`${$axios.defaults.baseURL}/Items/${relatedItem.Id}/Images/Primary`"
              />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ relatedItem.Name }}</v-list-item-title>
              <v-list-item-subtitle>{{
                relatedItem.ProductionYear
              }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div
          v-for="index in skeletonLength"
          :key="index"
          class="d-flex align-center mt-5 mb-5"
        >
          <v-skeleton-loader type="avatar" class="ml-3 mr-3" />
          <v-skeleton-loader type="sentences" width="10em" class="pr-5" />
        </div>
      </v-list>
    </div>
  </div>
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
    },
    vertical: {
      type: Boolean,
      default: false
    },
    skeletonLength: {
      type: Number,
      default: 5
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
          visibleSlides: 6
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
        await this.$api.library.getSimilarItems({
          itemId: this.id,
          userId: this.$auth.user.Id,
          limit: this.vertical ? 5 : 12
        })
      ).data.Items as BaseItemDto[];

      this.relatedItems = RelatedItems;
    } catch (error) {
      console.error('Unable to get related items:', error);
    }
  }
});
</script>

<style lang="scss" scoped>
.header span {
  padding-left: 0.25em;
}
.header::before {
  background-color: white;
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
</style>

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
