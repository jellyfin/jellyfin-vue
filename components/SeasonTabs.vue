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
            v-for="episode in seasonEpisodes[currentTab]"
            :key="episode.Id"
            nuxt
            :to="`/item/${episode.Id}/play`"
          >
            <v-list-item-avatar tile width="20em" height="12em">
              <blurhash-image
                v-if="episode.ImageTags && episode.ImageTags.Primary"
                :item="episode"
              />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ episode.Name }} </v-list-item-title>
              <v-list-item-subtitle>{{
                episode.Overview
              }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapActions } from 'vuex';
import { AppState } from '~/store';

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
      }
    };
  },
  computed: mapState<AppState>({
    seasons: (state: AppState) => state.tvShows.seasons,
    seasonEpisodes: (state: AppState) => state.tvShows.seasonEpisodes
  }),
  async beforeMount() {
    await this.getTvShows({
      item: this.item
    });
  },
  methods: {
    ...mapActions('tvShows', {
      getTvShows: 'getTvShows'
    })
  }
});
</script>
