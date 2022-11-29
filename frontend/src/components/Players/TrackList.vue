<template>
  <v-table dense class="track-table no-select">
    <thead>
      <tr>
        <th style="width: 4em" class="pr-0 text-center" scope="col">#</th>
        <th style="width: 3em" class="pr-0 pl-0" scope="col" />
        <th scope="col">{{ $t('item.tracklist.title') }}</th>
        <th style="width: 6.5em" class="text-center" scope="col">
          <Icon class="text--primary" size="16">
            <i-mdi-clock-outline />
          </Icon>
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
            <Icon class="text--secondary">
              <i-mdi-disc />
            </Icon>
            {{ $t('discNumber', { discNumber }) }}
          </td>
        </tr>
        <v-hover
          v-for="track in tracksOnDisc"
          v-slot="{ hover }"
          :key="track.Id">
          <tr
            :class="{ 'primary--text': isPlaying(track) }"
            @dblclick="playTracks(track)">
            <td style="width: 4em" class="pr-0 text-center">
              <span v-if="hover && !isPlaying(track)">
                <v-btn small icon @click="playTracks(track)">
                  <Icon>
                    <i-mdi-play-circle-outline />
                  </Icon>
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
                  v-if="!track.Artists.includes(track.AlbumArtist)"
                  class="ml-3">
                  <router-link
                    v-for="artist of track.ArtistItems"
                    :key="artist.Id"
                    tag="span"
                    class="link text--secondary"
                    :to="getItemDetailsLink(artist, 'MusicArtist')">
                    {{ artist.Name }}
                  </router-link>
                </div>
                <v-spacer />
                <item-menu v-show="hover" :item="item" />
              </div>
            </td>
            <td class="text-center">{{ getRuntime(track.RunTimeTicks) }}</td>
          </tr>
        </v-hover>
      </template>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import groupBy from 'lodash/groupBy';
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  SortOrder
} from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '~/utils/items';
import { ticksToMs } from '~/utils/time';
import { playbackManagerStore } from '~/store';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  data() {
    return {
      tracks: [] as BaseItemDtoQueryResult
    };
  },
  async fetch() {
    this.tracks = (
      await this.$api.items.getItems({
        userId: this.$remote.auth.currentUserId.value,
        parentId: this.item.Id,
        sortBy: ['SortName'],
        sortOrder: [SortOrder.Ascending]
      })
    ).data;
  },
  computed: {
    ...mapStores(playbackManagerStore),
    tracksPerDisc(): Record<string, BaseItemDto[]> {
      return groupBy(this.$data.tracks.Items, 'ParentIndexNumber');
    }
  },
  methods: {
    /**
     * @param ticks - The number of ticks to convert to track length
     * @returns Returns the length of the track in the format XX:XX
     */
    getRuntime(ticks: number): string {
      let seconds = ticksToMs(ticks) / 1000;
      const minutes = Math.floor(seconds / 60);

      seconds = Math.floor(seconds - minutes * 60);

      /**
       * Formats the second number
       *
       * @example 7 -> 07
       * @param seconds - Number to format
       * @returns Formatted seconds number
       */
      function formatSeconds(seconds: string): string {
        return ('0' + seconds).slice(-2);
      }

      return `${minutes}:${formatSeconds(seconds.toString())}`;
    },
    playTracks(track: BaseItemDto): void {
      this.playbackManager.play({
        item: this.item,
        startFromIndex: this.tracks.Items?.indexOf(track),
        initiator: this.item
      });
    },
    isPlaying(track: BaseItemDto): boolean {
      return track?.Id === this.playbackManager.getCurrentItem?.Id;
    },
    getItemDetailsLink
  }
});
</script>

<style lang="scss" scoped>
.v-data-table.track-table {
  background-color: transparent;
}

.v-data-table tr.disc-header:hover {
  background: transparent !important;
}

.no-select {
  user-select: none;
}
</style>
