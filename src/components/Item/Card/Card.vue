<template>
  <div :class="{ 'card-margin': margin }">
    <component
      :is="link ? 'nuxt-link' : 'div'"
      :to="link ? getItemDetailsLink(item) : null"
      :class="{ 'card-box': link }"
    >
      <!-- CARD -->
      <div :class="shape || cardType" class="elevation-2">
        <div
          class="
            card-content card-content-button
            d-flex
            justify-center
            align-center
            darken-4
          "
        >
          <blurhash-image
            :item="item"
            :type="getImageType"
            :alt="item.Name"
            class="card-image"
          />
          <v-progress-circular
            v-if="refreshProgress > 0"
            class="card-chip"
            rotate="-90"
            :value="refreshProgress"
            color="white"
            size="24"
          />
          <watched-indicator v-if="item.UserData && item.UserData.Played" />
          <v-chip
            v-if="item.UserData && item.UserData.UnplayedItemCount"
            color="primary"
            class="card-chip"
            small
          >
            {{ item.UserData.UnplayedItemCount }}
          </v-chip>
          <v-progress-linear
            v-if="
              item.UserData &&
              item.UserData.PlayedPercentage &&
              item.UserData.PlayedPercentage > 0
            "
            v-model="progress"
            color="primary accent-4"
            class="card-progress"
          />
        </div>
        <div
          v-if="overlay && isFinePointer()"
          class="card-overlay d-flex justify-center align-center"
        >
          <play-button fab :item="item" />
          <div
            v-if="overlay"
            class="card-lower-buttons d-flex justify-center align-center"
          >
            <mark-played-button :item="item" dark />
            <like-button v-if="canPlay(item)" :item="item" dark />
            <item-menu :item="item" dark />
          </div>
        </div>
      </div>
    </component>
    <div v-if="text" class="card-text">
      <nuxt-link
        class="link d-block card-title mt-1 text-truncate"
        :to="cardTitleLink"
      >
        {{ cardTitle }}
      </nuxt-link>
      <nuxt-link
        v-if="cardSubtitleLink"
        class="link d-block card-subtitle text--secondary text-truncate"
        :to="cardSubtitleLink"
      >
        {{ cardSubtitle }}
      </nuxt-link>
      <div v-else class="card-subtitle text--secondary text-truncate">
        {{ cardSubtitle }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';
import { CardShapes, getShapeFromItemType } from '~/utils/items';

export default Vue.extend({
  mixins: [imageHelper, itemHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    shape: {
      type: [String, Boolean],
      default: (): string | boolean => {
        return false;
      }
    },
    episode: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    },
    overlay: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    },
    text: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    },
    margin: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    },
    link: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    }
  },
  data() {
    return {
      refreshProgress: 0,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  computed: {
    cardType: {
      get(): string {
        // Otherwise, figure out the shape based on the type of the item
        return getShapeFromItemType(this.item.Type);
      }
    },
    /**
     * @returns {string} Either the item name or the series name
     */
    cardTitle(): string {
      if (this.item.Type !== 'Episode') {
        return this.item.Name || '';
      } else {
        return this.item.SeriesName || '';
      }
    },
    /**
     * @returns {string} Either a string representing the production year(s) for the current item
     *                   or the episode name of an item (SX EY - Episode Name)
     *                   or the album artist
     */
    cardSubtitle(): string {
      switch (this.item.Type) {
        case 'Episode':
          return `${this.$t('seasonEpisodeAbbrev', {
            seasonNumber: this.item.ParentIndexNumber,
            episodeNumber: this.item.IndexNumber
          })} - ${this.item.Name}`;
        case 'MusicAlbum':
          return `${this.item.AlbumArtist || ''}`;
        case 'Series': {
          if (this.item.Status === 'Continuing') {
            return `${this.item.ProductionYear} - ${this.$t('present')}`;
          } else if (this.item.EndDate) {
            const endYear = new Date(this.item?.EndDate).toLocaleString(
              'en-us',
              { year: 'numeric' }
            );

            if (this.item.ProductionYear?.toString() === endYear) {
              return this.item.ProductionYear.toString();
            }

            return `${this.item.ProductionYear} - ${endYear}`;
          }

          break;
        }
        case 'Movie':
        default:
          return `${this.item.ProductionYear ? this.item.ProductionYear : ''}`;
      }

      return '';
    },
    /**
     * Gets a link to be applied to the card title
     *
     * @returns {string} A router link to the item or a related item
     */
    cardTitleLink(): string {
      if (this.item.Type === 'Episode' && this.item.SeriesId) {
        return this.getItemDetailsLink({ Id: this.item.SeriesId }, 'Series');
      }

      return this.getItemDetailsLink(this.item);
    },
    /**
     * Gets a link to be applied to the card subtitle
     *
     * @returns {string|null} A router link to the parent item or a related item
     */
    cardSubtitleLink(): string | null {
      if (
        this.item.Type === 'MusicAlbum' &&
        this.item.AlbumArtists &&
        this.item.AlbumArtists.length > 0
      ) {
        return this.getItemDetailsLink(
          this.item.AlbumArtists[0],
          'MusicArtist'
        );
      } else if (this.item.Type === 'Episode') {
        return this.getItemDetailsLink(this.item);
      }

      return null;
    },
    progress: {
      get(): number | false {
        return this.item.UserData?.PlayedPercentage || false;
      }
    },
    getImageType(): ImageType {
      if (this.shape === CardShapes.Thumb) {
        return ImageType.Thumb;
      } else {
        return ImageType.Primary;
      }
    }
  },
  mounted() {
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (
        mutation.type === 'SOCKET_ONMESSAGE' &&
        state.socket.message.MessageType === 'RefreshProgress' &&
        state.socket.message.Data.ItemId === this.item.Id
      ) {
        this.refreshProgress = state.socket.message.Data.Progress;
      }
    });
  },
  destroyed() {
    this.unsubscribe();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    isFinePointer(): boolean {
      if (process.client) {
        return window.matchMedia('(pointer:fine)').matches;
      } else {
        return false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.card-lower-buttons {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
}

.card-box {
  cursor: pointer;
  padding: 0;
}

.card-margin {
  margin: 0.6em;
}

.portrait-card {
  position: relative;
  padding-bottom: 150%;
  contain: strict;
  border-radius: 0.3em;
}

.thumb-card {
  position: relative;
  padding-bottom: 56.25%;
  contain: strict;
  border-radius: 0.3em;
}

.square-card {
  position: relative;
  padding-bottom: 100%;
  contain: strict;
  border-radius: 0.3em;
}

.card-content {
  background-color: #{map-get($material-dark, 'menus')};
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 !important;
  height: 100%;
  width: 100%;
  contain: strict;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}

.theme--dark .card-content {
  background-color: #{map-get($material-dark, 'menus')};
}

.card-image {
  width: 100%;
  height: 100%;
}

.card-chip {
  position: absolute;
  top: 1em;
  right: 1em;
}

.card-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.card-overlay {
  position: absolute;
  background: radial-gradient(
    farthest-corner at 50% 50%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  transition: opacity 0.2s;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
}

@media (hover: hover) and (pointer: fine) {
  .card-box:hover .card-overlay {
    opacity: 1;
  }
}

.card-text {
  text-align: center;
  padding: 0 0.25em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.a {
  text-decoration: none;
}

.absolute {
  position: absolute;
}
</style>
