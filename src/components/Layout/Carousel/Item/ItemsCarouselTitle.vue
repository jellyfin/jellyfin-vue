<template>
  <div>
    <nuxt-link v-if="logo && logo.tag && logoLink" :to="logoLink">
      <v-img
        class="mb-2"
        :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
        :max-height="$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
        contain
        data-swiper-parallax="-300"
        :src="logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else-if="itemLink && titleString"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="itemLink"
    >
      {{ titleString }}
    </nuxt-link>
    <p
      v-if="subtitle"
      data-swiper-parallax="-200"
      class="text-truncate text-subtitle-2"
    >
      {{ subtitle }}
    </p>
    <h2
      v-if="item.Taglines && item.Taglines.length"
      data-swiper-parallax="-200"
      class="text-truncate"
    >
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import imageHelper, { ImageUrlInfo } from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper, imageHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  data() {
    return {
      itemLink: '',
      titleString: '',
      logoLink: '',
      subtitle: '',
      logo: {} as ImageUrlInfo
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        switch (this.item.Type) {
          case 'MusicAlbum':
            if (this.item.AlbumArtists?.length) {
              this.logoLink = this.getItemDetailsLink(
                this.item.AlbumArtists[0],
                'MusicArtist'
              );
            }

            if (this.item.AlbumArtist) {
              this.titleString = this.item.AlbumArtist;
            }

            if (this.item.Name) {
              this.subtitle = this.item.Name;
            }

            break;
          case 'Episode':
            if (this.item.SeriesId) {
              this.logoLink = this.getItemDetailsLink(
                { Id: this.item.SeriesId },
                'Series'
              );
            }

            if (
              this.item.SeasonName &&
              this.item.IndexNumber &&
              this.item.Name
            ) {
              const episodeString = this.$t('episodeNumber', {
                episodeNumber: this.item.IndexNumber
              });

              this.subtitle = `${this.item.SeasonName} - ${episodeString}\n${this.item.Name}`;
            }

            if (this.item.SeriesName) {
              this.titleString = this.item.SeriesName;
            }

            break;
        }

        // Instead of using 'default', we need this additional extra check
        // in case an Album doesn't have artists, for example.
        if (this.itemLink === '') {
          this.itemLink = this.getItemDetailsLink(this.item);
        }

        if (this.titleString === '' && this.item.Name) {
          this.titleString = this.item.Name;
        }

        this.logo = this.getLogo(this.item);
      }
    }
  }
});
</script>
