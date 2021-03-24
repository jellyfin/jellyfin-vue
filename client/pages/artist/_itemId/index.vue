<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start">
        <v-col cols="6" sm="3" class="d-flex flex-row">
          <v-img
            v-if="item.ImageTags && item.ImageTags.Primary"
            class="person-image elevation-2 ml-2"
            cover
            aspect-ratio="1"
            :src="getImageUrl(item.Id, 'Primary')"
          />
        </v-col>
        <v-col cols="12" sm="7">
          <v-row justify="space-between">
            <div class="ml-sm-4 d-flex flex-column">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
              >
                {{ $t('artist') }}
              </div>
              <h1 class="text-h4 text-md-h2 font-weight-light">
                {{ item.Name }}
              </h1>
            </div>
            <div class="d-flex align-center">
              <item-menu :item="item" />
              <like-button :item="item" />
            </div>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-tabs v-model="activeTab" background-color="transparent">
            <v-tab :key="0">{{ $t('item.artist.discography') }}</v-tab>
            <v-tab :key="1">{{ $t('item.artist.information') }}</v-tab>
          </v-tabs>
          <v-tabs-items v-model="activeTab" class="transparent">
            <v-tab-item :key="0">
              <v-row no-gutters>
                <v-col cols="12" class="ma-3">
                  <v-row v-for="appearance in appearances" :key="appearance.Id">
                    <v-col cols="12">
                      <div class="d-flex flex-column">
                        <v-row>
                          <v-col lg="2" sm="1">
                            <card :item="appearance" overlay link />
                          </v-col>
                          <v-col class="py-2">
                            <div
                              class="text-subtitle-1 text--secondary font-weight-medium"
                            >
                              {{ appearance.ProductionYear }}
                            </div>
                            <nuxt-link
                              class="link font-weight-bold text-h6 text-md-h4"
                              tag="h2"
                              :to="getItemDetailsLink(appearance)"
                            >
                              {{ appearance.Name }}
                            </nuxt-link>
                          </v-col>
                        </v-row>
                        <v-row v-if="$vuetify.breakpoint.mdAndUp" class="my-2">
                          <v-col>
                            <track-list
                              v-if="appearance.Type === 'MusicAlbum'"
                              :item="appearance"
                            />
                          </v-col>
                        </v-row>
                      </div>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-tab-item>
            <v-tab-item :key="1">
              <v-container>
                <v-row>
                  <v-col>
                    <v-img
                      cover
                      aspect-ratio="1.7778"
                      :src="getImageUrl(item.Id, 'Backdrop')"
                    />
                    <div v-if="item.Overview">
                      <h2 class="text-h6 mt-2">
                        <span>{{ $t('biography') }}</span>
                      </h2>
                      <v-col cols="12" sm="9" class="pl-0 pr-0">
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <p class="item-overview" v-html="overview" />
                      </v-col>
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </template>
    <template #right>
      <related-items :item="item" vertical>
        {{ $t('moreLikeArtist', { artist: item.Name }) }}
      </related-items>
    </template>
  </item-cols>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import itemHelper from '~/mixins/itemHelper';
import { isValidMD5 } from '~/utils/items';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, timeUtils, itemHelper],
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $api, $auth }) {
    const item = (
      await $api.userLibrary.getItem({
        userId: $auth.user?.Id,
        itemId: params.itemId
      })
    ).data;

    const appearances = (
      await $api.items.getItems({
        userId: $auth.user?.Id,
        albumArtistIds: [params.itemId],
        sortBy: 'PremiereDate,ProductionYear,SortName',
        sortOrder: 'Descending',
        recursive: true,
        includeItemTypes: ['MusicAlbum']
      })
    ).data.Items;

    return { item, appearances };
  },
  data() {
    return {
      activeTab: 0,
      item: {} as BaseItemDto,
      appearances: [] as BaseItemDto[]
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    overview(): string {
      if (this.$data.item.Overview) {
        return this.sanitizeHtml(this.$data.item.Overview);
      } else {
        return '';
      }
    }
  },
  watch: {
    item: {
      handler(val: BaseItemDto): void {
        this.setPageTitle({ title: val.Name });

        const hash = this.getBlurhash(val, ImageType.Backdrop);

        this.setBackdrop({ hash });
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getImageUrl(itemId: string | undefined, type: string): string | undefined {
      if (itemId) {
        return this.getImageUrlForElement(type as ImageType, { itemId });
      } else {
        return '';
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.person-image {
  border-radius: 50%;
}
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
