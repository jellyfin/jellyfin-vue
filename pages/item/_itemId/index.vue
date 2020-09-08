<template>
  <v-container fluid>
    <v-row>
      <v-col cols="4">
        <v-img :src="getImageLink(item.Id, 'primary')"></v-img>
      </v-col>
      <v-col cols="8">
        <h1>{{ item.Name }}</h1>
        <p>{{ ticksToTime(item.RunTimeTicks) }}</p>
        <p>{{ item.Overview }}</p>
        <v-btn color="primary">{{ $t('play') }}</v-btn>
        <v-btn>{{ $t('more') }}</v-btn>
      </v-col>
    </v-row>
    <season-tabs v-if="item.Type === 'Series'" :item="item"></season-tabs>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  data() {
    return {
      item: {} as BaseItemDto
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
  },
  methods: {
    ticksToTime(ticks: number) {
      const ms = ticks / 600000000;
      if (Math.floor(ms / 60)) {
        return `${Math.floor(ms / 60)} hrs ${Math.floor(ms % 60)} min`;
      } else {
        return `${Math.floor(ms % 60)} min`;
      }
    }
  }
});
</script>
