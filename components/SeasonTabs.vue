<template>
  <div>
    <v-tabs v-model="seasonTabs" class="mb-3">
      <v-tab v-for="season in seasons" :key="season.Id">
        {{ season.Name }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="seasonTabs">
      <v-tab-item v-for="season in seasons" :key="season.Id">
        <vueper-slides
          :visible-slides="3"
          :arrows-outside="false"
          slide-multiple
          :gap="2"
          :infinite="false"
          :disable-arrows-on-edges="true"
          :bullets="false"
          :breakpoints="breakpoints"
          :dragging-distance="200"
        >
          <vueper-slide v-for="episode in season.Episodes" :key="episode.Id">
            <template v-slot:content>
              <card :item="episode" episode />
            </template>
          </vueper-slide>
        </vueper-slides>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';

interface Seasons extends BaseItemDto {
  Episodes?: Array<BaseItemDto>;
}

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      seasons: [] as Seasons[],
      seasonTabs: null,
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
  async beforeMount() {
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

      season.Episodes = episodes;
    }
  }
});
</script>
