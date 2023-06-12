<template>
  <v-slide-y-reverse-transition mode="out-in">
    <v-footer
      v-if="
        playbackManager.isPlaying &&
        playbackManager.currentlyPlayingMediaType === 'Audio' &&
        playbackManager.currentItem
      "
      app
      class="user-select-none pa-0">
      <v-container fluid>
        <v-row class="ma-0">
          <v-col cols="9" md="3" class="d-flex flex-row pa-0">
            <router-link :to="'/playback/music'">
              <v-avatar :size="$vuetify.display.xs ? 50 : 85" color="primary">
                <blurhash-image :item="playbackManager.currentItem" />
              </v-avatar>
            </router-link>
            <v-col class="d-flex flex-column justify-center ml-4">
              <v-row class="align-end">
                <router-link
                  v-slot="{ navigate }"
                  :to="getItemDetailsLink(playbackManager.currentItem)"
                  custom>
                  <span
                    class="text-truncate link height-fit-content"
                    @click="navigate">
                    {{ playbackManager.currentItem.Name }}
                  </span>
                </router-link>
              </v-row>
              <v-row
                v-if="playbackManager.currentItem.ArtistItems"
                class="align-start">
                <span
                  v-for="artist in playbackManager.currentItem.ArtistItems"
                  :key="`artist-${artist.Id}`">
                  <p class="mb-0 mr-2">
                    <router-link
                      v-slot="{ navigate }"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      custom>
                      <span
                        class="font-weight-light text-caption text-truncate link"
                        @click="navigate">
                        {{ artist.Name }}
                      </span>
                    </router-link>
                  </p>
                </span>
              </v-row>
            </v-col>
          </v-col>
          <v-col cols="6" class="pa-0 d-none d-md-inline">
            <div class="d-flex flex-column justify-center">
              <div class="d-flex align-center justify-center">
                <shuffle-button class="mx-1" />
                <previous-track-button class="mx-1" />
                <play-pause-button class="mx-1" />
                <next-track-button class="mx-1" />
                <repeat-button class="mx-1" />
              </div>
              <time-slider />
            </div>
          </v-col>
          <v-col cols="3" class="d-none d-md-flex align-center justify-end">
            <like-button
              :item="playbackManager.currentItem"
              class="active-button" />
            <queue-button />
            <div class="hidden-lg-and-down">
              <volume-slider />
            </div>
            <item-menu :item="playbackManager.currentItem" :z-index="99999" />
            <v-btn icon to="/playback/music">
              <v-icon>
                <i-mdi-fullscreen />
              </v-icon>
            </v-btn>
          </v-col>
          <v-col
            cols="3"
            class="d-flex d-md-none pa-0 align-center justify-end">
            <play-pause-button class="mx-1" />
            <next-track-button class="mx-1" />
            <repeat-button v-if="!$vuetify.display.xs" class="mx-1" />
            <shuffle-button v-if="!$vuetify.display.xs" class="mx-1" />
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-slide-y-reverse-transition>
</template>

<script setup lang="ts">
import { getItemDetailsLink } from '@/utils/items';
import { playbackManagerStore } from '@/store';
import { usePlayerKeys } from '@/composables/use-playerkeys';

usePlayerKeys(false);

const playbackManager = playbackManagerStore();
</script>

<style lang="scss" scoped>
.height-fit-content {
  height: fit-content;
}
</style>
