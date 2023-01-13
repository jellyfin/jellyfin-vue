<template>
  <div>
    <router-link v-if="logo && logo.tag && logoLink" :to="logoLink">
      <v-img
        class="mb-2"
        :max-width="$vuetify.display.mdAndUp ? '50%' : '40%'"
        :max-height="$vuetify.display.smAndUp ? '7.5em' : '4em'"
        contain
        data-swiper-parallax="-300"
        :src="logo.url" />
    </router-link>
    <router-link
      v-else-if="itemLink && titleString"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="itemLink">
      {{ titleString }}
    </router-link>
    <p
      v-if="subtitle"
      data-swiper-parallax="-200"
      class="text-truncate text-subtitle-2">
      {{ subtitle }}
    </p>
    <h2
      v-if="item.Taglines && item.Taglines.length > 0"
      data-swiper-parallax="-200"
      class="text-truncate">
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getLogo, ImageUrlInfo } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';

export default defineComponent({
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
      subtitle: ''
    };
  },
  computed: {
    logo(): ImageUrlInfo {
      return getLogo(this.item);
    }
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        switch (this.item.Type) {
          case 'MusicAlbum': {
            if (this.item.AlbumArtists?.length) {
              this.logoLink = getItemDetailsLink(
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
          }
          case 'Episode': {
            if (this.item.SeriesId) {
              this.logoLink = getItemDetailsLink(
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
        }

        /**
         * Instead of using 'default', we need this additional extra check
         * in case an Album doesn't have artists, for example.
         */
        if (this.itemLink === '') {
          this.itemLink = getItemDetailsLink(this.item);
        }

        if (this.titleString === '' && this.item.Name) {
          this.titleString = this.item.Name;
        }
      }
    }
  }
});
</script>
