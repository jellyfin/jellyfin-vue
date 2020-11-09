<template>
  <v-simple-table dense class="track-table no-select">
    <thead>
      <tr>
        <th style="width: 4em" class="pr-0" scope="col">#</th>
        <th style="width: 3em" class="pr-0 pl-0" scope="col"></th>
        <th scope="col">Title</th>
        <th class="col-1" scope="col"><v-icon>mdi-timer-outline</v-icon></th>
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
            {{ $t('disc', { discNumber }) }}
          </td>
        </tr>
        <nuxt-link
          v-for="track in tracksOnDisc"
          :key="track.Id"
          :to="`/item/${track.Id}/play`"
          tag="tr"
        >
          <td style="width: 4em" class="pr-0">{{ track.IndexNumber }}</td>
          <td style="width: 3em" class="pr-0 pl-0">
            <v-btn icon>
              <v-icon>mdi-heart-outline</v-icon>
            </v-btn>
          </td>
          <td>
            <div class="d-flex align-center">
              <span>{{ track.Name }}</span>
              <v-btn icon class="ml-auto">
                <v-icon>mdi-dots-horizontal</v-icon>
              </v-btn>
            </div>
          </td>
          <td>{{ getRuntime(track.RunTimeTicks) }}</td>
        </nuxt-link>
      </template>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts">
import { groupBy } from 'lodash';
import Vue from 'vue';
import { BaseItemDto, BaseItemDtoQueryResult } from '~/api';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
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
  computed: {
    tracksPerDisc: {
      get() {
        return groupBy(this.$data.tracks.Items, 'ParentIndexNumber');
      }
    }
  },
  async beforeMount() {
    const tracks = (
      await this.$api.items.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        parentId: this.item.Id,
        fields: 'Overview'
      })
    ).data;

    this.tracks = tracks;
  },
  methods: {
    getRuntime(ticks: number) {
      function padLeft(string: string, pad: string, length: number): string {
        return (new Array(length + 1).join(pad) + string).slice(-length);
      }
      let seconds = this.ticksToMs(ticks) / 1000;
      const minutes = Math.floor(seconds / 60);
      seconds = Math.floor(seconds - minutes * 60);
      return `${minutes}:${padLeft(seconds.toString(), '0', 2)}`;
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
