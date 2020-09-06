<template>
  <v-container fluid>
    <v-row>
      <v-col cols="4">
        <v-img :src="getImageLink(item.Id, 'primary')"></v-img>
      </v-col>
      <v-col cols="8">
        <h1>{{ item.Name }}</h1>
        <p>{{ item.Overview }}</p>
        <v-btn color="primary">{{ $t('play') }}</v-btn>
        <v-btn>{{ $t('more') }}</v-btn>
      </v-col>
    </v-row>
    <div v-if="item.Type === 'Series'">
      <v-tabs v-model="seasonTabs" class="mb-3">
        <v-tab v-for="season in allEpisodes" :key="season.Id">
          {{ season.Name }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="seasonTabs">
        <v-tab-item v-for="season in allEpisodes" :key="season.Id">
          <vueper-slides
            :visible-slides="3"
            :arrows-outside="false"
            slide-multiple
            :gap="2"
            :infinite="false"
            :disable-arrows-on-edges="true"
            :bullets="false"
            :dragging-distance="200"
          >
            <vueper-slide v-for="episode in season.Episodes" :key="episode.Id">
              <template v-slot:content>
                <v-card>
                  <v-img :src="getImageLink(episode.Id, 'primary')"></v-img>
                  <v-card-subtitle>
                    <span>Episode {{ episode.IndexNumber }}</span>
                  </v-card-subtitle>
                  <v-card-title>{{ episode.Name }}</v-card-title>
                </v-card>
              </template>
            </vueper-slide>
          </vueper-slides>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';

interface allEpisodes extends Array<{ Name: string; Episodes: BaseItemDto[] }> {
  [index: number]: { Name: string; Episodes: BaseItemDto[] };
}

export default Vue.extend({
  mixins: [imageHelper],
  data() {
    return {
      item: {} as BaseItemDto,
      seasons: [] as BaseItemDto[],
      allEpisodes: [] as allEpisodes,
      seasonTabs: null
    };
  },

  async beforeMount() {
    const Item = (
      await this.$itemsApi.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        ids: this.$route.params.itemId,
        fields: 'Overview'
      })
    ).data.Items as BaseItemDto[];

    this.item = Item[0];

    if (this.item.Type === 'Series') {
      const seasons = (
        await this.$tvShowsApi.getSeasons({
          userId: this.$auth.user.Id,
          seriesId: this.item.Id || ''
        })
      ).data.Items as BaseItemDto[];

      this.seasons = seasons;

      for (const season of this.seasons) {
        const episodes = (
          await this.$itemsApi.getItems({
            uId: this.$auth.user.Id,
            userId: this.$auth.user.Id,
            parentId: season.Id
          })
        ).data.Items as BaseItemDto[];

        this.allEpisodes.push({
          Name: season.Name || 'Missing Season Name',
          Episodes: episodes
        });
      }
    }
  }
});
</script>
