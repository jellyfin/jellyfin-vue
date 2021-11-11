<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-sm="start">
        <v-col cols="6" sm="3" class="d-flex flex-row">
          <v-responsive aspect-ratio="1">
            <v-avatar
              color="card"
              width="100%"
              height="100%"
              class="elevation-2"
            >
              <blurhash-image :item="item" />
            </v-avatar>
          </v-responsive>
        </v-col>
        <v-col cols="12" sm="7">
          <v-row justify="d-flex flex-column">
            <div class="ml-sm-4 d-flex flex-column">
              <div
                class="
                  text-subtitle-1 text--secondary
                  font-weight-medium
                  text-capitalize
                "
              >
                {{ $t('item.person.person') }}
              </div>
              <h1 class="text-h4 text-md-h2 font-weight-light">
                {{ item.Name }}
              </h1>
            </div>
            <div class="d-flex align-center ml-sm-4 my-2">
              <play-button :items="[item]" />
              <item-menu :item="item" />
              <like-button :item="item" />
            </div>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-tabs v-model="activeTab" background-color="transparent">
            <v-tab :key="0" :disabled="!moviesIds.length">
              {{ $t('item.person.movies') }}
            </v-tab>
            <v-tab :key="1" :disabled="!seriesIds.length">
              {{ $t('item.person.shows') }}
            </v-tab>
            <v-tab :key="2" :disabled="!booksIds.length">
              {{ $t('item.person.books') }}
            </v-tab>
            <v-tab :key="3" :disabled="!photosIds.length">
              {{ $t('item.person.photos') }}
            </v-tab>
            <v-tab :key="4" :disabled="!item.Overview">
              {{ $t('item.person.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="activeTab" class="transparent">
            <v-tab-item :key="0">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="movies" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="1">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="series" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="2">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="books" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="3">
              <v-container>
                <v-row>
                  <v-col>
                    <item-grid :items="photos" large />
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
            <v-tab-item :key="4">
              <v-container>
                <v-row>
                  <v-col>
                    <v-row>
                      <v-col cols="12" md="7">
                        <span class="item-overview" v-text="item.Overview" />
                      </v-col>
                      <v-col cols="12" md="5">
                        <v-row v-if="birthDate || birthPlace" no-gutters>
                          <v-col cols="2" md="5" class="text--secondary">
                            {{ $t('item.person.birth') }}
                          </v-col>
                          <v-col cols="9" md="7">
                            <p>
                              {{ birthDate }}
                              {{ birthPlace }}
                            </p>
                          </v-col>
                        </v-row>
                        <v-row v-if="deathDate" no-gutters>
                          <v-col cols="2" md="5" class="text--secondary">
                            {{ $t('item.person.death') }}
                          </v-col>
                          <v-col cols="9" md="7">
                            {{ deathDate }}
                          </v-col>
                        </v-row>
                        <v-row
                          v-if="!deathDate && !birthDate && !birthPlace"
                          no-gutters
                        >
                          <v-col cols="12">
                            {{ $t('noInformationAvailable') }}
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
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
import { mapActions, mapGetters } from 'vuex';
import { BaseItemDto, ImageType, SortOrder } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';
import { isValidMD5 } from '~/utils/items';

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $userLibrary, $items, store }) {
    const itemId = params.itemId;

    if (!store.getters['items/getItem'](itemId)) {
      await $userLibrary.getItem(itemId);
    }

    const moviesIds = await $items.getItems({
      personIds: [itemId],
      sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
      sortOrder: [SortOrder.Descending],
      recursive: true,
      includeItemTypes: ['Movie']
    });

    const seriesIds = await $items.getItems({
      personIds: [itemId],
      sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
      sortOrder: [SortOrder.Descending],
      recursive: true,
      includeItemTypes: ['Series']
    });

    const booksIds = await $items.getItems({
      personIds: [itemId],
      sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
      sortOrder: [SortOrder.Descending],
      recursive: true,
      includeItemTypes: ['Book']
    });

    const photosIds = await $items.getItems({
      personIds: [itemId],
      sortBy: ['PremiereDate', 'ProductionYear', 'SortName'],
      sortOrder: [SortOrder.Descending],
      recursive: true,
      includeItemTypes: ['Photo']
    });

    let activeTab = 4;

    if (moviesIds.length) {
      activeTab = 0;
    } else if (seriesIds.length) {
      activeTab = 1;
    } else if (booksIds.length) {
      activeTab = 2;
    } else if (photosIds.length) {
      activeTab = 3;
    }

    return { activeTab, moviesIds, seriesIds, booksIds, photosIds, itemId };
  },
  data() {
    return {
      activeTab: 0,
      moviesIds: [] as string[],
      seriesIds: [] as string[],
      booksIds: [] as string[],
      photosIds: [] as string[],
      itemId: '' as string
    };
  },
  computed: {
    ...mapGetters('items', ['getItem', 'getItems']),
    item(): BaseItemDto {
      return this.getItem(this.itemId);
    },
    movies(): BaseItemDto[] {
      return this.getItems(this.moviesIds);
    },
    series(): BaseItemDto[] {
      return this.getItems(this.seriesIds);
    },
    books(): BaseItemDto[] {
      return this.getItems(this.booksIds);
    },
    photos(): BaseItemDto[] {
      return this.getItems(this.photosIds);
    },
    birthDate(): Date | null {
      if (this.item.PremiereDate) {
        return this.$dateFns.format(new Date(this.item.PremiereDate), 'PPP', {
          locale: this.$i18n.locale
        });
      } else {
        return null;
      }
    },
    deathDate: {
      get(): Date | null {
        if (this.item.EndDate) {
          return this.$dateFns.format(new Date(this.item.EndDate), 'PPP', {
            locale: this.$i18n.locale
          });
        } else {
          return null;
        }
      }
    },
    birthPlace: {
      get(): string | null {
        if (this.item.ProductionLocations) {
          return this.item.ProductionLocations[0];
        } else {
          return null;
        }
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
  mounted() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop'])
  }
});
</script>

<style lang="scss" scoped>
.person-image {
  border-radius: 50%;
}
</style>
