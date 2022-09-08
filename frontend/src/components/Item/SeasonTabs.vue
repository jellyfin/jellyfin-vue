<template>
  <div>
    <v-tabs v-model="currentTab" class="mb-3" background-color="transparent">
      <v-tab v-for="season in seasons" :key="season.Id">
        {{ season.Name }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="currentTab" class="transparent">
      <v-tab-item v-for="season in seasons" :key="season.Id">
        <v-list two-line color="transparent">
          <v-list-item
            v-for="episode in seasonEpisodes[season.Id]"
            :key="episode.Id"
            nuxt
            :to="getItemDetailsLink(episode)"
            class="flex-column flex-md-row"
          >
            <v-list-item-avatar tile width="20em" height="12em">
              <blurhash-image
                v-if="episode.ImageTags && episode.ImageTags.Primary"
                :item="episode"
                :alt="episode.Name"
              />
              <watched-indicator v-if="episode.UserData.Played" />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="text-wrap">
                {{ episode.IndexNumber }}. {{ episode.Name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-wrap">
                {{ episode.Overview }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { BaseItemDto, ItemFields } from '@jellyfin/client-axios';
import Vue from 'vue';
import { authStore } from '~/store';
import { getItemDetailsLink } from '~/utils/items';

interface TvShowItem {
  /**
   * seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * seasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: { [key: string]: BaseItemDto[] };
}

export default Vue.extend({
  props: {
    item: {
      type: Object,
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
      },
      seasons: [] as BaseItemDto[],
      seasonEpisodes: {} as TvShowItem['seasonEpisodes']
    };
  },
  async fetch() {
    const auth = authStore();
    const seasons = (
      await this.$api.tvShows.getSeasons({
        userId: auth.currentUserId,
        seriesId: this.item.Id
      })
    ).data.Items;

    const seasonEpisodes = {} as TvShowItem['seasonEpisodes'];

    if (seasons) {
      for (const season of seasons) {
        if (season.Id) {
          const episodes = (
            await this.$api.items.getItems({
              userId: auth.currentUserId,
              parentId: season.Id,
              fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio]
            })
          ).data;

          if (episodes.Items) {
            seasonEpisodes[season.Id] = episodes.Items;
          }
        }

        this.seasons = seasons;
        this.seasonEpisodes = seasonEpisodes;
      }
    }
  },
  methods: {
    getItemDetailsLink
  }
});
</script>
