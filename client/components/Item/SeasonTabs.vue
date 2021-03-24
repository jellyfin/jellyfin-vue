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
          >
            <v-list-item-avatar tile width="20em" height="12em">
              <blurhash-image
                v-if="episode.ImageTags && episode.ImageTags.Primary"
                :item="episode"
                :alt="episode.Name"
              />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ episode.Name }}</v-list-item-title>
              <v-list-item-subtitle>
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
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { TvShowItem } from '~/store/tvShows';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper],
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
  methods: {
    ...mapActions('tvShows', {
      getTvShows: 'getTvShows'
    }),
    ...mapActions('playbackManager', ['play'])
  }
});
</script>
