<template>
  <nuxt-link :to="itemLink" style="text-decoration: none; color: inherit">
    <div class="card-box">
      <div :class="cardType">
        <button
          class="card-content card-content-button d-flex justify-center align-center"
          :style="{ backgroundImage: `url('${imageLink(item.Id)}')` }"
        >
          <v-icon
            v-if="!item.ImageTags.Primary"
            size="96"
            color="grey lighten-3"
          >
            {{ itemIcon }}
          </v-icon>
        </button>
        <div class="card-overlay d-flex justify-center align-center">
          <v-btn fab color="primary" :to="`/item/${item.Id}/play`">
            <v-icon size="36">mdi-play</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="card-text">
        <div class="card-title mt-1">{{ item.Name }}</div>
        <div class="card-subtitle grey--text">{{ cardSubtitle() }}</div>
      </div>
    </div>
  </nuxt-link>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    item: {
      type: Object,
      required: true,
      default: () => {
        return {
          Name: 'Missing Name'
        };
      }
    },
    shape: {
      type: [String, Boolean],
      required: false,
      default: () => {
        return false;
      }
    }
  },
  computed: {
    itemLink: {
      get() {
        if (this.item.Type === 'Folder') {
          return `/library/${this.item.Id}`;
        } else {
          return `/item/${this.item.Id}`;
        }
      }
    },
    cardType: {
      get() {
        // If the shape is forced externally, use that instead
        if (this.shape) {
          return this.shape;
        }
        // Otherwise, figure out the shape based on the type of the item
        switch (this.item.Type) {
          case 'Book':
          case 'BoxSet':
          case 'Movie':
          case 'MusicArtist':
          case 'Person':
          case 'Series':
            return 'portrait-card';
          case 'Audio':
          case 'Folder':
          case 'MusicAlbum':
          case 'PhotoAlbum':
          case 'Playlist':
          case 'Video':
            return 'square-card';
          default:
            return '';
        }
      }
    },
    itemIcon: {
      get() {
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
    }
  },
  methods: {
    imageLink(id: string) {
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
    },
    /**
     * @returns {string} Empty sting || item Production year || item Production year - Present || item Production Year - item End Year
     */
    cardSubtitle(): string {
      if (this.item.Type !== 'Series' && this.item.ProductionYear) {
        return this.item.ProductionYear;
      } else if (
        this.item.Status === 'Continuing' &&
        this.item.ProductionYear
      ) {
        return `${this.item.ProductionYear} - ${this.$t('present')}`;
      } else if (this.item.ProductionYear && this.item.EndDate) {
        const endYear = new Date(this.item.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });
        return `${this.item.ProductionYear} - ${endYear}`;
      } else {
        return '';
      }
    }
  }
});
</script>

<style scoped>
.card-box {
  cursor: pointer;
  padding: 0;
  margin: 0.6em;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
.portrait-card {
  position: relative;
  padding-bottom: 150%;
  contain: strict;
}
.thumb-card {
  position: relative;
  padding-bottom: 56.25%;
  contain: strict;
}
.square-card {
  position: relative;
  padding-bottom: 100%;
  contain: strict;
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
  border-radius: 0.3em;
  background-color: #00455c;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}
.card-overlay {
  border-radius: 0.3em;
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
