<template>
  <div class="text--secondary">
    <span v-if="item.Type === 'Episode'">
      {{
        $t('seasonEpisodeAbbrev', {
          seasonNumber: item.ParentIndexNumber,
          episodeNumber: item.IndexNumber
        })
      }}
    </span>
    <span v-if="item.ProductionYear && year">{{ item.ProductionYear }}</span>
    <span v-if="item.OfficialRating && rating">{{ item.OfficialRating }}</span>
    <span v-if="item.CommunityRating && rating">
      <v-icon class="rating-icon" size="16">mdi-star</v-icon>
      {{ item.CommunityRating.toFixed(1) }}
    </span>
    <span v-if="item.Type === 'MusicAlbum' && item.ChildCount && tracks">
      {{ $t('numberTracks', { number: item.ChildCount }) }}
    </span>
    <span v-if="item.RunTimeTicks && runtime">{{
      getRuntimeTime(item.RunTimeTicks)
    }}</span>
    <span v-if="item.RunTimeTicks && endsAt">
      {{ getEndsAtTime(item.RunTimeTicks, true) }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { getEndsAtTime, getRuntimeTime } from '~/utils/time';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    year: {
      type: Boolean
    },
    rating: {
      type: Boolean
    },
    runtime: {
      type: Boolean
    },
    tracks: {
      type: Boolean
    },
    endsAt: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getEndsAtTime,
    getRuntimeTime
  }
});
</script>

<style lang="scss" scoped>
span {
  margin-left: 0.6em;
  margin-right: 0.6em;
}

span:first-of-type {
  margin-left: 0;
}

span:last-of-type {
  margin-right: 0;
}

.rating-icon {
  opacity: 0.6;
}
</style>
