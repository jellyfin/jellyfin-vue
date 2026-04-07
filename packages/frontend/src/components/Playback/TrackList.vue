<template>
  <VTable
    density="compact"
    class="track-table uno-select-none">
    <thead>
      <tr>
        <th
          style="width: 4em"
          class="text-center pr-0"
          scope="col">
          #
        </th>
        <th
          style="width: 3em"
          class="pr-0 pl-0"
          scope="col" />
        <th scope="col">
          {{ $t('title') }}
        </th>
        <th
          style="width: 6.5em"
          class="text-center"
          scope="col">
          <JIcon
            class="i-mdi:clock-outline" />
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(tracksOnDisc, discNumber) in tracksPerDisc">
        <tr
          v-if="hasMultipleDiscs"
          :key="discNumber"
          class="disc-header">
          <td
            colspan="4"
            class="text--secondary">
            <JIcon
              class="text--secondary i-mdi:disc" />
            {{ $t('discNumber', { discNumber }) }}
          </td>
        </tr>
        <template
          v-for="track in tracksOnDisc"
          :key="track.Id">
          <JHover v-slot="{ isHovering }">
            <tr
              :class="{ 'text-primary': isPlaying(track) }"
              @dblclick="playTracks(track)">
              <td
                style="width: 4em"
                class="pr-0 text-center">
                <span v-if="isHovering && !isPlaying(track)">
                  <VBtn
                    size="small"
                    icon
                    @click="playTracks(track)">
                    <JIcon class="i-mdi:play-circle-outline" />
                  </VBtn>
                </span>
                <span v-else>{{ track.IndexNumber }}</span>
              </td>
              <td
                style="width: 3em"
                class="pr-0 pl-0 text-center">
                <LikeButton :item="track" />
              </td>
              <td>
                <div class="d-flex align-center">
                  <span>{{ track.Name }}</span>
                  <div
                    v-if="
                      track &&
                        track.Artists &&
                        track.AlbumArtist &&
                        !track.Artists.includes(track.AlbumArtist)
                    "
                    class="ml-3">
                    <template
                      v-for="artist of track.ArtistItems"
                      :key="artist.Id">
                      <RouterLink
                        v-slot="{ navigate }"
                        :to="getItemDetailsLink(artist, 'MusicArtist')"
                        custom>
                        <span
                          class="text--secondary link"
                          @click="navigate">
                          {{ artist.Name }}
                        </span>
                      </RouterLink>
                    </template>
                  </div>
                  <VSpacer />
                  <ItemMenu
                    v-show="isHovering"
                    :item="track" />
                </div>
              </td>
              <td class="text-center">
                {{ formatTicks(track.RunTimeTicks || 0) }}
              </td>
            </tr>
          </JHover>
        </template>
      </template>
    </tbody>
  </VTable>
</template>

<script setup lang="ts">
import type {
  BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { playbackManager } from '#/store/playback-manager';
import { getItemDetailsLink } from '#/utils/items';
import { formatTicks } from '#/utils/time';

const { item, tracks } = defineProps<{
  item: BaseItemDto;
  tracks: BaseItemDto[];
}>();

const tracksPerDisc = computed(() => Object.groupBy(tracks, ({ ParentIndexNumber }) => ParentIndexNumber!));
const hasMultipleDiscs = computed(() => {
  let loops = 0;

  for (const _ in tracksPerDisc.value) {
    loops++;

    if (loops > 1) {
      return true;
    }
  }

  return false;
});

/**
 * Check if a given BaseItemDto is playing
 */
function isPlaying(track: BaseItemDto): boolean {
  return track.Id === playbackManager.currentItem.value?.Id;
}

/**
 * Play all the tracks from an item
 */
async function playTracks(track: BaseItemDto): Promise<void> {
  await playbackManager.play({
    item: item,
    startFromIndex: tracks.indexOf(track),
    initiator: item
  });
}
</script>

<style scoped>
.v-data-table.track-table {
  background-color: transparent;
}

.v-data-table tr.disc-header:hover {
  background: transparent !important;
}
</style>
