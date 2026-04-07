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
        <VRow class="uno-m-0">
          <VCol
            cols="9"
            md="3"
            class="uno-flex uno-flex-row uno-p-0">
            <RouterLink :to="'/playback/music'">
              <div class="img uno-h-20 uno-w-20">
                <BlurhashImage :item="playbackManager.currentItem.value" />
              </div>
            </RouterLink>
            <VCol class="uno-ml-4 uno-flex uno-flex-col uno-justify-center">
              <VRow class="uno-items-end">
                <RouterLink
                  v-slot="{ navigate }"
                  :to="getItemDetailsLink(playbackManager.currentItem.value)"
                  custom>
                  <span
                    class="uno-h-fit uno-cursor-pointer uno-truncate uno-color-inherit uno-decoration-none"
                    @click="navigate">
                    {{ playbackManager.currentItem.value?.Name }}
                  </span>
                </RouterLink>
              </VRow>
              <VRow
                v-if="playbackManager.currentItem.value?.ArtistItems"
                class="uno-items-start">
                <span
                  v-for="artist in playbackManager.currentItem.value?.ArtistItems"
                  :key="`artist-${artist.Id}`">
                  <p class="uno-mb-0 uno-mr-2">
                    <RouterLink
                      v-slot="{ navigate }"
                      :to="getItemDetailsLink(artist, 'MusicArtist')"
                      custom>
                      <span
                        class="uno-transform-none uno-cursor-pointer uno-truncate uno-text-xs uno-color-inherit uno-font-normal uno-leading-7 uno-tracking-wide uno-decoration-none"
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
            class="uno-hidden uno-p-0 uno-min-[960px]:inline">
            <div class="uno-flex uno-flex-col uno-justify-center">
              <div class="uno-flex uno-items-center uno-justify-center">
                <ShuffleButton class="uno-mx-1" />
                <PreviousTrackButton class="uno-mx-1" />
                <PlayPauseButton class="uno-mx-1" />
                <NextTrackButton class="uno-mx-1" />
                <RepeatButton class="uno-mx-1" />
              </div>
              <TimeSlider />
            </div>
          </VCol>
          <VCol
            cols="3"
            class="uno-hidden uno-items-center uno-justify-end uno-min-[960px]:flex">
            <LikeButton :item="playbackManager.currentItem.value" />
            <QueueButton />
            <div class="uno-hidden uno-min-[1920px]:block">
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
            class="uno-flex uno-items-center uno-justify-end uno-p-0 uno-min-[960px]:hidden">
            <PlayPauseButton class="uno-mx-1" />
            <NextTrackButton class="uno-mx-1" />
            <RepeatButton
              v-if="!$vuetify.display.xs"
              class="uno-mx-1" />
            <ShuffleButton
              v-if="!$vuetify.display.xs"
              class="uno-mx-1" />
          </VCol>
        </VRow>
      </VContainer>
    </JFooter>
  </JTransition>
</template>

<script setup lang="ts">
import { isNil } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager.ts';
import { getItemDetailsLink } from '#/utils/items.ts';
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
