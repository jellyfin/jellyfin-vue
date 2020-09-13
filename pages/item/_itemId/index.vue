<template>
  <v-container fluid class="pa-0 item-container">
    <v-img
      v-resize="updateBackdropImage"
      :src="backdropImageSource"
      class="d-flex align-end backdrop-image"
      max-width="100%"
    >
      <div class="d-flex align-end gradient-container">
        <div class="d-flex flex-wrap item-details-container">
          <div class="white--text">
            <v-img
              v-if="
                item.ImageTags && item.ImageTags.Logo && getAspectRatio() > 1
              "
              :src="getImageLink(item.Id, 'Logo')"
              contain
              :alt="item.Name"
              max-width="50%"
              class="mb-4"
            ></v-img>
            <h1 v-else>{{ item.Name }}</h1>
            <div class="item-sub-heading">{{ renderItemSubHeading() }}</div>
            <p class="item-overview">{{ item.Overview }}</p>
          </div>
          <div class="item-details-right">
            <v-btn
              class="play-button"
              color="primary"
              :to="`./${item.Id}/play`"
              >{{ $t('playType', { mediaType: item.Type }) }}</v-btn
            >
            <v-btn>{{ $t('more') }}</v-btn>
          </div>
        </div>
      </div>
    </v-img>
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
      item: {} as BaseItemDto,
      backdropImageSource: ''
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

    this.updateBackdropImage();
  },
  methods: {
    getAspectRatio() {
      return window.innerWidth / window.innerHeight;
    },
    getItemBackdrop(id: string): string {
      if (window.innerWidth < window.innerHeight) {
        return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
      } else {
        return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Backdrop`;
      }
    },
    getEndsAtTime(ticks: number): string {
      const ms = ticks / 10000;
      const endTimeLong = new Date(Date.now() + ms);
      const endTimeShort = endTimeLong.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric'
      });

      return `${this.$t('endsAt')}: ${endTimeShort}`;
    },
    ticksToTime(ticks: number) {
      const ms = ticks / 600000000;
      if (Math.floor(ms / 60) && Math.floor(ms % 60)) {
        return `${Math.floor(ms / 60)} hrs ${Math.floor(ms % 60)} min`;
      } else if (Math.floor(ms / 60)) {
        return `${Math.floor(ms / 60)} hrs`;
      } else {
        return `${Math.floor(ms % 60)} min`;
      }
    },
    renderItemSubHeading() {
      const response = [];
      if (this.item.ProductionYear) {
        response.push(this.item.ProductionYear);
      }
      if (this.item.Genres) {
        response.push(this.item.Genres[0]);
      }
      if (this.item.RunTimeTicks) {
        response.push(this.ticksToTime(this.item.RunTimeTicks));
      }
      if (this.item.RunTimeTicks) {
        response.push(this.getEndsAtTime(this.item.RunTimeTicks));
      }
      return response.join(' • ');
    },
    updateBackdropImage() {
      this.backdropImageSource = this.getItemBackdrop(this.item.Id || '');
    }
  }
});
</script>

<style scoped>
.item-container {
  margin: auto;
  max-width: calc(85vh * 16 / 9);
}

.backdrop-image {
  max-width: 95em;
  margin: auto;
}

.item-details-container {
  padding: 1em;
}

.gradient-container {
  background: linear-gradient(0deg, #0c0c0c, transparent);
  height: 30vh;
}

.item-sub-heading {
  font-size: 0.8rem;
  width: fit-content;
}

@media screen and (max-width: 30em) {
  .item-overview {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 90vw;
  }
}
</style>
