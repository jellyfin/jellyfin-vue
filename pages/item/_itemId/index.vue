<template>
  <v-container fluid>
    <v-row>
      <v-col cols="4">
        <v-img
          :src="getItemBackdrop(item.Id)"
          class="d-flex align-end backdropImage"
          max-width="100%"
        ></v-img>
      </v-col>
      <v-col cols="8">
        <h1>{{ item.Name }}</h1>
        <div class="itemSubHeading">{{ renderItemSubHeading() }}</div>
        <p>{{ item.Overview }}</p>
        <v-btn class="playButton" color="primary" :to="`./${item.Id}/play`">{{
          $t('play')
        }}</v-btn>
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
        fields: 'Overview,Genres'
      })
    ).data.Items as BaseItemDto[];

    this.item = Item[0];
  },
  methods: {
    getItemBackdrop(id: string) {
      if (window.innerWidth < window.innerHeight) {
        return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
      } else if (window.innerHeight < window.innerWidth) {
        return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Backdrop`;
      }
    },
    ticksToTime(ticks: number) {
      const ms = ticks / 600000000;
      if (Math.floor(ms / 60)) {
        return `${Math.floor(ms / 60)} hrs ${Math.floor(ms % 60)} min`;
      } else {
        return `${Math.floor(ms % 60)} min`;
      }
    },
    renderItemSubHeading() {
      const response = [];
      if (this.item.Genres) {
        response.push(this.item.Genres[0]);
      }
      if (this.item.RunTimeTicks) {
        response.push(this.ticksToTime(this.item.RunTimeTicks));
      }
      if (this.item.ProductionYear) {
        response.push(this.item.ProductionYear);
      }
      return response.join(' ');
    }
  }
});
</script>

<style scoped>
.backdropImage {
  max-width: 95em;
  margin: auto;
}

.itemSubHeading {
  color: #b9b9b9;
  font-size: 0.8rem;
  width: fit-content;
}
</style>
