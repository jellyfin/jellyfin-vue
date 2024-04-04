<template>
  <JTransition
    name="slide-y-reverse"
    mode="out-in">
    <VFooter
      v-if="
        playbackManager.isPlaying &&
          playbackManager.currentlyPlayingMediaType === 'Audio' &&
          playbackManager.currentItem
      "
      app
      class="user-select-none pa-0">
      <VContainer fluid>
        <VRow class="ma-0">
          <VCol
            cols="9"
            md="3"
            class="d-flex flex-row pa-0">
            <RouterLink :to="'/playback/music'">
              <VAvatar
                :size="$vuetify.display.xs ? 50 : 85"
                color="primary">
                <BlurhashImage :item="playbackManager.currentItem" />
              </VAvatar>
            </RouterLink>
            <VCol class="d-flex flex-column justify-center ml-4">
              <VRow class="align-end">
                <RouterLink
                  v-slot="{ navigate }"
                  :to="getItemDetailsLink(playbackManager.currentItem)"
                  custom>
                  <span
                    class="text-truncate link height-fit-content"
                    @click="navigate">
                    {{ playbackManager.currentItem.Name }}
                  </span>
                </RouterLink>
              </VRow>
              <VRow
                v-if="playbackManager.currentItem.ArtistItems"
                class="align-start">
                <span
                  v-for="artist in playbackManager.currentItem.ArtistItems"
                  :key="`artist-${artist.Id}`">
                  <p class="mb-0 mr-2">
                    <RouterLink
                      v-slot="{ navigate }"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      custom>
                      <span
                        class="font-weight-light text-caption text-truncate link"
                        @click="navigate">
                        {{ artist.Name }}
                      </span>
                    </RouterLink>
                  </p>
                </span>
              </VRow>
            </VCol>
          </VCol>
          <VCol
            cols="6"
            class="pa-0 d-none d-md-inline">
            <div class="d-flex flex-column justify-center">
              <div class="d-flex align-center justify-center">
                <ShuffleButton class="mx-1" />
                <PreviousTrackButton class="mx-1" />
                <PlayPauseButton class="mx-1" />
                <NextTrackButton class="mx-1" />
                <RepeatButton class="mx-1" />
              </div>
              <TimeSlider />
            </div>
          </VCol>
          <VCol
            cols="3"
            class="d-none d-md-flex align-center justify-end">
            <LikeButton :item="playbackManager.currentItem" />
            <QueueButton />
            <div class="hidden-lg-and-down">
              <VolumeSlider />
            </div>
            <ItemMenu
              :item="playbackManager.currentItem"
              :media-source-index="playbackManager.currentMediaSourceIndex"
              :z-index="99999" />
            <VBtn
              icon
              to="/playback/music">
              <VIcon>
                <IMdiFullscreen />
              </VIcon>
            </VBtn>
          </VCol>
          <VCol
            cols="3"
            class="d-flex d-md-none pa-0 align-center justify-end">
            <PlayPauseButton class="mx-1" />
            <NextTrackButton class="mx-1" />
            <RepeatButton
              v-if="!$vuetify.display.xs"
              class="mx-1" />
            <ShuffleButton
              v-if="!$vuetify.display.xs"
              class="mx-1" />
          </VCol>
        </VRow>
      </VContainer>
    </VFooter>
  </JTransition>
</template>

<script setup lang="ts">
import { playbackManager } from '@/store/playback-manager';
import { getItemDetailsLink } from '@/utils/items';
</script>

<style lang="scss" scoped>
.height-fit-content {
  height: fit-content;
}
</style>
