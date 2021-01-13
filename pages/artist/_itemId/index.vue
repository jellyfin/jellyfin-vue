<template>
  <v-container>
    <v-row>
      <v-col cols="9">
        <v-row>
          <v-col cols="9" class="d-flex flex-row">
            <v-img
              v-if="item.ImageTags && item.ImageTags.Primary"
              class="person-image elevation-2 ml-2"
              cover
              aspect-ratio="1"
              :src="getImageUrl(item.Id, 'Primary')"
            />
            <div class="ml-4 d-flex flex-column">
              <div
                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
              >
                {{ $t('artist') }}
              </div>
              <h1 class="text-h2 font-weight-light">{{ item.Name }}</h1>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-tabs v-model="activeTab" background-color="transparent">
              <v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
            </v-tabs>
            <v-tabs-items v-model="activeTab" class="transparent">
              <v-tab-item :key="0">
                <v-row>
                  <v-col cols="12" class="mx-3">
                    <h2 class="text-h6">
                      <span>{{ $t('albums') }}</span>
                    </h2>
                    <v-row
                      v-for="appearance in appearances"
                      :key="appearance.Id"
                    >
                      <v-col cols="12">
                        <div class="d-flex flex-column">
                          <v-row>
                            <v-col cols="1">
                              <card :item="appearance" no-text no-margin />
                            </v-col>
                            <v-col>
                              <div
                                class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
                              >
                                {{ appearance.ProductionYear }}
                              </div>
                              <nuxt-link
                                class="link"
                                tag="h2"
                                :to="`/item/${appearance.Id}/`"
                              >
                                {{ appearance.Name }}
                              </nuxt-link>
                            </v-col>
                          </v-row>
                          <v-row>
                            <v-col>
                              <track-list
                                v-if="appearance.Type === 'MusicAlbum'"
                                :item="appearance"
                              ></track-list>
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
                      <v-img cover :src="getImageUrl(item.Id, 'Backdrop')" />
                      <div v-if="item.Overview">
                        <h2 class="text-h6 mt-2">
                          <span>{{ $t('biography') }}</span>
                        </h2>
                        <v-col cols="9" class="pl-0 pr-0">
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
      </v-col>
      <v-col cols="3">
        <related-items :item="item" vertical>
          {{ $t('moreLikeArtist', { artist: item.Name }) }}
        </related-items>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, timeUtils],
  data() {
    return {
      activeTab: 0,
      tabs: ['Overview', 'About'],
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
  async beforeMount() {
    const item = (
      await this.$api.userLibrary.getItem({
        userId: this.$auth.user?.Id,
        itemId: this.$route.params.itemId
      })
    ).data;

    if (item) {
      this.setPageTitle({ title: item.Name });
      this.setAppBarOpacity({ opaqueAppBar: false });
      const hash = this.getBlurhash(item, ImageType.Backdrop);
      this.setBackdrop({ hash });
      this.item = item;
    }

    const appearances = (
      await this.$api.items.getItems({
        userId: this.$auth.user?.Id,
        parentId: this.$route.params.itemId,
        sortBy: 'PremiereDate,ProductionYear,SortName',
        sortOrder: 'Descending'
      })
    ).data.Items;

    if (appearances) {
      this.appearances = appearances;
    }
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
  max-width: 8em;
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
.link {
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}
</style>
