<template>
  <v-table density="compact" class="track-table user-select-none">
    <thead>
      <tr>
        <th style="width: 4em" class="pr-0 text-center" scope="col">#</th>
        <th style="width: 3em" class="pr-0 pl-0" scope="col" />
        <th scope="col">{{ $t('item.tracklist.title') }}</th>
        <th style="width: 6.5em" class="text-center" scope="col">
          <v-icon class="text--primary" size="16">
            <i-mdi-clock-outline />
          </v-icon>
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(tracksOnDisc, discNumber) in tracksPerDisc">
        <tr
          v-if="Object.keys(tracksPerDisc).length > 1"
          :key="discNumber"
          class="disc-header">
          <td colspan="4" class="text--secondary">
            <v-icon class="text--secondary">
              <i-mdi-disc />
            </v-icon>
            {{ $t('discNumber', { discNumber }) }}
          </td>
        </tr>
        <template v-for="track in tracksOnDisc" :key="track.Id">
          <v-hover v-slot="{ isHovering, props: hoverProps }">
            <tr
              :class="{ 'text-primary': isPlaying(track) }"
              v-bind="hoverProps"
              @dblclick="playTracks(track)">
              <td style="width: 4em" class="pr-0 text-center">
                <span v-if="isHovering && !isPlaying(track)">
                  <v-btn size="small" icon @click="playTracks(track)">
                    <v-icon>
                      <i-mdi-play-circle-outline />
                    </v-icon>
                  </v-btn>
                </span>
                <span v-else>{{ track.IndexNumber }}</span>
              </td>
              <td style="width: 3em" class="pr-0 pl-0 text-center">
                <like-button :item="track" />
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
                      <router-link
                        v-slot="{ navigate }"
                        :to="getItemDetailsLink(artist, 'MusicArtist')"
                        custom>
                        <span class="link text--secondary" @click="navigate">
                          {{ artist.Name }}
                        </span>
                      </router-link>
                    </template>
                  </div>
                  <v-spacer />
                  <item-menu v-show="isHovering" :item="track" />
                </div>
              </td>
              <td class="text-center">
                {{ formatTicks(track.RunTimeTicks || 0) }}
              </td>
            </tr>
          </v-hover>
        </template>
      </template>
    </tbody>
  </v-table>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { groupBy } from 'lodash-es';
import {
  BaseItemDto,
  ItemFields,
  SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getItemDetailsLink } from '@/utils/items';
import { formatTicks } from '@/utils/time';
import { playbackManagerStore } from '@/store';
import { useRemote } from '@/composables';

const props = defineProps<{ item: BaseItemDto }>();

const playbackManager = playbackManagerStore();
const remote = useRemote();
const tracks = ref<BaseItemDto[] | null | undefined>();

/**
 * Fetch component data
 */
async function fetch(): Promise<void> {
  tracks.value = (
    await remote.sdk.newUserApi(getItemsApi).getItems({
      userId: remote.auth.currentUserId || '',
      parentId: props.item.Id,
      sortBy: ['SortName'],
      sortOrder: [SortOrder.Ascending],
      fields: [
        ItemFields.MediaSources,
        ItemFields.CanDelete,
        ItemFields.CanDownload
      ]
    })
  ).data.Items;
}

await fetch();
watch(props, async () => {
  await fetch();
});

const tracksPerDisc = computed(() => {
  return groupBy(tracks.value, 'ParentIndexNumber');
});

/**
 * Check if a given BaseItemDto is playing
 */
function isPlaying(track: BaseItemDto): boolean {
  return track.Id === playbackManager.currentItem?.Id;
}

/**
 * Play all the tracks from an item
 */
async function playTracks(track: BaseItemDto): Promise<void> {
  if (tracks.value) {
    await playbackManager.play({
      item: props.item,
      startFromIndex: tracks.value.indexOf(track),
      initiator: props.item
    });
  }
}
</script>

<style lang="scss" scoped>
.v-data-table.track-table {
  background-color: transparent;
}

.v-data-table tr.disc-header:hover {
  background: transparent !important;
}
</style>
