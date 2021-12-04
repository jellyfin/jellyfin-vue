<template>
  <div>
    <p
      v-if="season && item.SeasonName"
      data-swiper-parallax="-200"
      class="mb-n1 text-truncate text-subtitle-2"
    >
      {{ item.SeasonName }}
    </p>
    <p
      v-if="episodeNumber && item.IndexNumber"
      data-swiper-parallax="-200"
      class="mb-n1 text-truncate text-subtitle-2"
    >
      {{ $t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
    </p>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h4 text-sm-h3 text-truncate"
      :to="link"
    >
      {{ item.Name }}
    </nuxt-link>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    parent: {
      type: Boolean,
      required: false,
      default: false
    },
    season: {
      type: Boolean,
      required: false,
      default: false
    },
    episodeNumber: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      link: ''
    };
  },
  beforeMount(): void {
    if (this.parent) {
      switch (this.item.Type) {
        case 'MusicAlbum':
          if (this.item.AlbumArtists?.length) {
            this.link = this.getItemDetailsLink(
              this.item.AlbumArtists[0],
              'MusicArtist'
            );
          }

          break;
        case 'Episode':
          if (this.item.SeriesId) {
            this.link = this.getItemDetailsLink(
              { Id: this.item.SeriesId },
              'Series'
            );
          }

          break;
      }
    } else {
      this.link = this.getItemDetailsLink(this.item);
    }
  }
});
</script>
