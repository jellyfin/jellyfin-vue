<template>
  <JTransition
    name="slide-y-reverse"
    mode="out-in">
    <JFooter
      v-if="
        playbackManager.isPlaying.value &&
          playbackManager.isAudio.value &&
          !isNil(playbackManager.currentItem.value)
      "
      class="uno-select-none uno-bg-surface">
      <VContainer fluid>
        <VRow class="ma-0">
          <VCol
            cols="9"
            md="3"
            class="pa-0 d-flex flex-row">
            <RouterLink :to="'/playback/music'">
              <div class="img uno-h-20 uno-w-20">
                <BlurhashImage :item="playbackManager.currentItem.value" />
              </div>
            </RouterLink>
            <VCol class="d-flex flex-column justify-center ml-4">
              <VRow class="align-end">
                <RouterLink
                  v-slot="{ navigate }"
                  :to="getItemDetailsLink(playbackManager.currentItem.value)"
                  custom>
                  <span
                    class="text-truncate link uno-h-fit"
                    @click="navigate">
                    {{ playbackManager.currentItem.value?.Name }}
                  </span>
                </RouterLink>
              </VRow>
              <VRow
                v-if="playbackManager.currentItem.value?.ArtistItems"
                class="align-start">
                <span
                  v-for="artist in playbackManager.currentItem.value?.ArtistItems"
                  :key="`artist-${artist.Id}`">
                  <p class="mr-2 mb-0">
                    <RouterLink
                      v-slot="{ navigate }"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      custom>
                      <span
                        class="text-truncate link text-caption"
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
            class="d-none align-center d-md-flex justify-end">
            <LikeButton :item="playbackManager.currentItem.value" />
            <QueueButton />
            <div class="hidden-lg-and-down">
              <VolumeSlider />
            </div>
            <ItemMenu
              :item="playbackManager.currentItem.value"
              :media-source-index="playbackManager.currentMediaSourceIndex.value"
              :z-index="99999" />
            <VBtn
              icon
              to="/playback/music">
              <JIcon class="i-mdi:fullscreen" />
            </VBtn>
          </VCol>
          <VCol
            cols="3"
            class="d-flex pa-0 align-center justify-end d-md-none">
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
    </JFooter>
  </JTransition>
</template>

<script setup lang="ts">
import { isNil } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager';
import { getItemDetailsLink } from '#/utils/items';
</script>

<style scoped>
/* TODO: This class was extracted from VAvatar. Remove this once a JAvatar component is created */
.img {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  line-height: normal;
  overflow: hidden;
  position: relative;
  text-align: center;
  vertical-align: middle;
}
</style>
