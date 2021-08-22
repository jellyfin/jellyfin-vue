<template>
  <v-simple-table dense class="track-table no-select">
    <thead>
      <tr>
        <th style="width: 4em" class="pr-0 text-center" scope="col">#</th>
        <th style="width: 3em" class="pr-0 pl-0" scope="col" />
        <th scope="col">{{ $t('item.tracklist.title') }}</th>
        <th style="width: 6.5em" class="text-center" scope="col">
          <v-icon class="text--primary" size="16">mdi-clock-outline</v-icon>
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(tracksOnDisc, discNumber) in tracksPerDisc">
        <tr
          v-if="Object.keys(tracksPerDisc).length > 1"
          :key="discNumber"
          class="disc-header"
        >
          <td colspan="4" class="text--secondary">
            <v-icon class="text--secondary">mdi-disc</v-icon>
            {{ $t('discNumber', { discNumber }) }}
          </td>
        </tr>
        <v-hover
          v-for="track in tracksOnDisc"
          v-slot="{ hover }"
          :key="track.Id"
        >
          <tr
            :class="{ 'primary--text': isPlaying(track) }"
            @dblclick="playTracks(track)"
          >
            <td style="width: 4em" class="pr-0 text-center">
              <span v-if="hover">
                <v-btn small icon @click="playTracks(track)">
                  <v-icon>mdi-play-circle-outline</v-icon>
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
                  class="ml-3"
                >
                  <nuxt-link
                    v-for="artist of track.ArtistItems"
                    :key="artist.Id"
                    tag="span"
                    class="link text--secondary"
                    :to="getItemDetailsLink(artist, 'MusicArtist')"
                  >
                    {{ artist.Name }}
                  </nuxt-link>
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
  </v-simple-table>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import groupBy from 'lodash/groupBy';
import { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/client-axios';
import timeUtils from '~/mixins/timeUtils';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [timeUtils, itemHelper],
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
        userId: this.$auth.user?.Id,
        parentId: this.item.Id,
        sortBy: 'SortName',
        sortOrder: 'Ascending'
      })
    ).data;
  },
  computed: {
    tracksPerDisc(): Record<string, BaseItemDto[]> {
      return groupBy(this.$data.tracks.Items, 'ParentIndexNumber');
    }
  },
  methods: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapActions('playbackManager', ['play']),
    /**
     * @param {number} ticks - The number of ticks to convert to track length
     * @returns {string} Returns the length of the track in the format XX:XX
     */
    getRuntime(ticks: number): string {
      let seconds = this.ticksToMs(ticks) / 1000;
      const minutes = Math.floor(seconds / 60);

      seconds = Math.floor(seconds - minutes * 60);

      /**
       * Formats the second number
       *
       * @example 7 -> 07
       * @param {string} seconds - Number to format
       * @returns {string} Formatted seconds number
       */
      function formatSeconds(seconds: string): string {
        return ('0' + seconds).slice(-2);
      }

      return `${minutes}:${formatSeconds(seconds.toString())}`;
    },
    playTracks(track: BaseItemDto): void {
      this.play({
        item: this.item,
        startFromIndex: this.tracks.Items?.indexOf(track),
        initiator: this.item
      });
    },
    isPlaying(track: BaseItemDto): boolean {
      return track?.Id === this.getCurrentItem()?.Id;
    }
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
