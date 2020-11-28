<template>
  <div>
    <div v-if="!vertical" class="related-items">
      <slot>
        <h1 class="text-h5 mb-2 ml-2 header">
          <span>{{ $t('youMayAlsoLike') }}</span>
        </h1>
      </slot>
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
          <template #content>
            <card :item="item" />
          </template>
        </vueper-slide>

        <template #arrow-left>
          <v-btn icon large>
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </template>

        <template #arrow-right>
          <v-btn icon large>
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
      </vueper-slides>
    </div>
    <div v-if="vertical">
      <h2 v-if="!loading && relatedItems.length > 0">
        <slot>
          {{ $t('youMayAlsoLike') }}
        </slot>
      </h2>
      <v-skeleton-loader v-else type="heading" />
      <v-list color="transparent" two-line>
        <div v-if="!loading && relatedItems.length > 0">
          <v-list-item
            v-for="relatedItem in relatedItems"
            :key="relatedItem.Id"
            nuxt
            :to="`/item/${relatedItem.Id}`"
          >
            <v-list-item-avatar>
              <v-img
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
          v-else
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
import { mapActions } from 'vuex';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    /**
     * itemId To be used to get related items
     */
    item: {
      type: Object,
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
      relatedItems: [] as BaseItemDto[] | null | undefined,
      loading: true,
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
  watch: {
    item() {
      this.refreshItems();
    }
  },
  beforeMount() {
    try {
      this.refreshItems();
    } catch (error) {
      this.pushSnackbarMessage({
        message: this.$t('unableGetRelated'),
        color: 'error'
      });
    }
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async refreshItems() {
      this.loading = true;

      if (this.item.Id) {
        const response = await this.$api.library.getSimilarItems({
          itemId: this.item.Id,
          userId: this.$auth.user.Id,
          limit: this.vertical ? 5 : 12
        });

        this.relatedItems = response.data.Items;
      }

      this.loading = false;
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
