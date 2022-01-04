<template>
  <div>
    <div v-if="!vertical" class="related-items">
        <swiper-section
          :title="title"
          :items="relatedItems"
          :loading="loading"
        />
    </div>
    <div v-else-if="vertical">
      <h2 v-if="!loading && relatedItems.length > 0" class="text-h6 text-sm-h5">
        <slot>
          {{ $t('youMayAlsoLike') }}
        </slot>
      </h2>
      <v-skeleton-loader v-else-if="loading" type="heading" />
      <v-list color="transparent" two-line>
        <div v-if="!loading && relatedItems.length > 0">
          <v-list-item
            v-for="relatedItem in relatedItems"
            :key="relatedItem.Id"
            nuxt
            :to="getItemDetailsLink(relatedItem)"
          >
            <v-list-item-avatar>
              <v-avatar color="card">
                <blurhash-image :item="relatedItem" icon-size="16" />
              </v-avatar>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ relatedItem.Name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ relatedItem.ProductionYear }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div
          v-for="index in skeletonLength"
          v-else-if="loading"
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
import { BaseItemDto } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [imageHelper, itemHelper],
  props: {
    /**
     * item.Id To be used to get related items
     */
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    vertical: {
      type: Boolean,
      default: false
    },
    skeletonLength: {
      type: Number,
      default: 5
    },
    title: {
      type: String,
      default(): string {
        return this.$t('youMayAlsoLike').toString();
      }
    }
  },
  data() {
    return {
      relatedItems: [] as BaseItemDto[],
      loading: true
    };
  },
  watch: {
    item(): void {
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
    async refreshItems(): Promise<void> {
      this.loading = true;

      if (this.item.Id) {
        const response = await this.$api.library.getSimilarItems({
          itemId: this.item.Id,
          userId: this.$auth.user?.Id,
          limit: this.vertical ? 5 : 12,
          excludeArtistIds: this.item.AlbumArtists?.flatMap(
            (albumArtist: BaseItemDto) =>
              albumArtist.Id ? [albumArtist.Id] : []
          )
        });

        if (response.data.Items) {
          this.relatedItems = response.data.Items;
        }
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
