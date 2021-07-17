<template>
  <div>
    <v-tabs
      v-model="currentTab"
      class="mb-3"
      background-color="transparent"
      :vertical="!$vuetify.breakpoint.mobile"
    >
      <v-tab v-for="season in seasons" :key="season.Id" class="justify-start">
        <div class="d-flex flex-column align-start">
          <span class="text--primary font-weight-bold">{{ season.Name }}</span>
          <span class="text--secondary">{{ season.ProductionYear }}</span>
        </div>
        <div class="d-flex ml-4">
          <v-icon v-if="season.UserData.Played" class="text--primary">
            mdi-check
          </v-icon>
          <div v-else class="d-inline-block empty-icon" />
        </div>
      </v-tab>
      <v-tabs-items v-model="currentTab" class="transparent">
        <v-tab-item v-for="season in seasons" :key="season.Id">
          <item-grid :items="seasonEpisodes[season.Id]" episode large />
        </v-tab-item>
      </v-tabs-items>
    </v-tabs>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { TvShowItem } from '~/store/tvShows';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  data() {
    return {
      currentTab: 0,
      breakpoints: {
        600: {
          visibleSlides: 2
        },
        960: {
          visibleSlides: 3
        },
        1264: {
          visibleSlides: 4
        },
        1904: {
          visibleSlides: 5
        }
      }
    };
  },
  async fetch() {
    await this.getTvShows({ itemId: this.item.Id });
  },
  computed: {
    ...mapGetters('tvShows', ['getSeasons', 'getSeasonEpisodes']),
    seasons(): BaseItemDto[] {
      return this.getSeasons(this.item.Id);
    },
    seasonEpisodes(): TvShowItem['seasonEpisodes'] {
      return this.getSeasonEpisodes(this.item.Id);
    }
  },
  watch: {
    seasons: {
      immediate: true,
      handler(newVal: BaseItemDto[]): void {
        if (newVal?.length > 0) {
          /* Get the index of the first unwatched season.
           If there is none, findIndex returns -1, so we round up to 0 using Math.max */
          this.currentTab = Math.max(
            0,
            this.seasons.findIndex((season: BaseItemDto) => {
              return !season.UserData?.Played;
            })
          );
        }
      }
    }
  },
  methods: {
    ...mapActions('tvShows', {
      getTvShows: 'getTvShows'
    }),
    ...mapActions('playbackManager', ['play'])
  }
});
</script>

<style lang="scss" scoped>
.empty-icon {
  width: 24px;
  height: 24px;
}
</style>
