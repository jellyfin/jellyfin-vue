<template>
  <nuxt-link :to="itemLink" style="text-decoration: none; color: inherit">
    <div class="card-box" :class="{ 'card-margin': !noMargin }">
      <div :class="shape || cardType" class="elevation-3">
        <div
          class="card-content card-content-button d-flex justify-center align-center primary darken-4"
        >
          <blurhash-image
            v-if="item.ImageTags && item.ImageTags.Primary"
            :item="item"
            class="card-image"
          />
          <v-chip
            v-if="item.UserData && item.UserData.Played"
            color="green"
            class="card-chip"
            small
          >
            <v-icon>mdi-check</v-icon>
          </v-chip>
          <v-chip
            v-if="item.UserData && item.UserData.UnplayedItemCount"
            color="primary"
            class="card-chip"
            small
          >
            {{ item.UserData.UnplayedItemCount }}
          </v-chip>
          <v-icon
            v-if="
              !item.ImageTags || (item.ImageTags && !item.ImageTags.Primary)
            "
            size="96"
            color="primary darken-2"
          >
            {{ itemIcon }}
          </v-icon>
          <v-progress-linear
            v-if="
              item.UserData &&
              item.UserData.PlayedPercentage &&
              item.UserData.PlayedPercentage > 0
            "
            v-model="progress"
            color="primary accent-4"
            class="align-self-end"
          />
        </div>
        <div
          v-if="overlay"
          class="card-overlay d-flex justify-center align-center"
        >
          <v-btn fab color="primary" :to="`/item/${item.Id}/play`">
            <v-icon size="36">mdi-play</v-icon>
          </v-btn>
        </div>
      </div>
      <div v-if="!noText" class="card-text">
        <div class="card-title mt-1 text-truncate">{{ item.Name }}</div>
        <div class="card-subtitle text--secondary">{{ cardSubtitle }}</div>
      </div>
    </div>
  </nuxt-link>
</template>

<script lang="ts">
import Vue from 'vue';
import imageHelper from '~/mixins/imageHelper';
import { BaseItemDto } from '~/api';

export default Vue.extend({
  mixins: [imageHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    shape: {
      type: [String, Boolean],
      default: () => {
        return false;
      }
    },
    episode: {
      type: Boolean,
      default: () => {
        return false;
      }
    },
    overlay: {
      type: Boolean,
      default: () => {
        return true;
      }
    },
    noText: {
      type: Boolean,
      default: () => {
        return false;
      }
    },
    noMargin: {
      type: Boolean,
      default: () => {
        return false;
      }
    }
  },
  computed: {
    itemLink: {
      get(): string {
        if (this.item.Type === 'Folder') {
          return `/library/${this.item.Id}`;
        } else if (this.item.Type === 'Person') {
          return `/person/${this.item.Id}`;
        } else if (this.item.Type === 'MusicArtist') {
          return `/artist/${this.item.Id}`;
        } else if (this.item.Type === 'Genre') {
          return `/genre/${this.item.Id}`;
        } else {
          return `/item/${this.item.Id}`;
        }
      }
    },
    cardType: {
      get(): string {
        // Otherwise, figure out the shape based on the type of the item
        switch (this.item.Type) {
          case 'Audio':
          case 'Folder':
          case 'MusicAlbum':
          case 'MusicArtist':
          case 'MusicGenre':
          case 'PhotoAlbum':
          case 'Playlist':
          case 'Video':
            return 'square-card';
          case 'Episode':
          case 'Studio':
            return 'thumb-card';
          case 'Book':
          case 'BoxSet':
          case 'Genre':
          case 'Movie':
          case 'Person':
          case 'Series':
          default:
            return 'portrait-card';
        }
      }
    },
    itemIcon: {
      get(): string {
        switch (this.item.Type) {
          case 'Audio':
            return 'mdi-music-note';
          case 'Book':
            return 'mdi-book-open-page-variant';
          case 'BoxSet':
            return 'mdi-folder-multiple';
          case 'Folder':
            return 'mdi-folder';
          case 'Movie':
            return 'mdi-filmstrip';
          case 'MusicAlbum':
            return 'mdi-album';
          case 'MusicArtist':
          case 'Person':
            return 'mdi-account';
          case 'PhotoAlbum':
            return 'mdi-image-multiple';
          case 'Playlist':
            return 'mdi-playlist-play';
          case 'Series':
            return 'mdi-television-classic';
          default:
            return '';
        }
      }
    },
    /**
     * @returns {string} Either an empty string, or a string representing the production year(s) for the current item or the relevant episode number of the item.
     */
    cardSubtitle(): string {
      if (this.episode) {
        if (this.item.IndexNumber) {
          return this.$t('episodeNumber', {
            episodeNumber: this.item.IndexNumber
          }).toString();
        }
      } else if (this.item.Type !== 'Series' && this.item.ProductionYear) {
        return this.item.ProductionYear.toString();
      } else if (
        this.item.Status === 'Continuing' &&
        this.item.ProductionYear
      ) {
        return `${this.item.ProductionYear} - ${this.$t('present')}`;
      } else if (this.item.ProductionYear && this.item.EndDate) {
        const endYear = new Date(this.item.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });
        if (this.item.ProductionYear.toString() === endYear) {
          return this.item.ProductionYear.toString();
        }
        return `${this.item.ProductionYear} - ${endYear}`;
      }
      return '';
    },
    progress: {
      get(): number | false {
        return this.item.UserData?.PlayedPercentage || false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';
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
.card-image {
  width: 100%;
  height: 100%;
}
.card-chip {
  position: absolute;
  top: 1em;
  right: 1em;
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
</style>
