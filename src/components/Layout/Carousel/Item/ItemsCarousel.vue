<template>
  <carousel progressbar :slides="items.length" @onSlideChange="onSlideChange">
    <template #slides>
      <swiper-slide v-for="item in items" :key="item.Id">
        <div class="slide-backdrop" data-swiper-parallax="-100">
          <div class="default-icon" />
          <blurhash-image
            :key="`${item.Id}-image`"
            :item="getRelatedItem(item)"
            :type="'Backdrop'"
            :icon-size="$vuetify.breakpoint.mdAndUp ? '256' : '128'"
          />
        </div>
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 py-md-4 align-end align-sm-center align-md-start"
          >
            <v-row>
              <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
                <p class="text-overline text-truncate mb-2 my-2">
                  <slot name="referenceText" />
                </p>
                <items-carousel-title :item="item" />
                <media-info
                  :item="item"
                  year
                  tracks
                  runtime
                  rating
                  class="mb-3"
                  data-swiper-parallax="-100"
                />
                <play-button :item="item" data-swiper-parallax="-100" />
                <v-btn
                  min-width="12em"
                  outlined
                  rounded
                  nuxt
                  data-swiper-parallax="-100"
                  :to="getItemDetailsLink(item)"
                >
                  {{ $t('viewDetails') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </swiper-slide>
    </template>
  </carousel>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, itemHelper],
  props: {
    items: {
      type: Array as () => BaseItemDto[],
      required: true
    },
    pageBackdrop: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      relatedItems: {} as { [k: number]: BaseItemDto }
    };
  },
  async mounted() {
    // TODO: Server should include a ParentImageBlurhashes property, so we don't need to do a call
    // for the parent items. Revisit this once proper changes are done.
    for (const [key, i] of this.items.entries()) {
      let id: string;

      if (i.Type === 'Episode' && i?.SeriesId) {
        id = i.SeriesId;
      } else if (i.Type === 'MusicAlbum' && i?.AlbumArtists?.[0]?.Id) {
        id = i.AlbumArtists[0]?.Id;
      } else if (i?.ParentLogoItemId) {
        id = i.ParentLogoItemId;
      } else {
        continue;
      }

      const itemData = (
        await this.$api.userLibrary.getItem({
          userId: this.$auth.user?.Id,
          itemId: id
        })
      ).data;

      this.relatedItems[key] = itemData;
    }

    this.updateBackdrop(0);
  },
  destroyed() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getRelatedItem(item: BaseItemDto): BaseItemDto {
      const rItem = this.relatedItems[this.items.indexOf(item)];

      if (!rItem) {
        return item;
      }

      return rItem;
    },
    getOverview(item: BaseItemDto): string {
      if (item.Overview) {
        return this.sanitizeHtml(item.Overview);
      } else {
        return '';
      }
    },
    updateBackdrop(index: number) {
      if (this.pageBackdrop) {
        const hash = this.getBlurhash(this.items[index], ImageType.Backdrop);

        this.setBackdrop({ hash });
      }
    },
    onSlideChange(index: number): void {
      this.updateBackdrop(index);
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/styles/HomeHeader.scss';

.slide-backdrop {
  background-color: #{map-get($material-dark, 'menus')};
}
</style>

@import "~/assets/styles/HomeHeader.scss"; .slide-backdrop { background-color:
#{map-get($material-dark, "menus")}; }
