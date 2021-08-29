<template>
  <div class="text--secondary">
    <span v-if="item.ProductionYear && year">{{ item.ProductionYear }}</span>
    <span v-if="item.OfficialRating && rating">{{ item.OfficialRating }}</span>
    <span v-if="item.CommunityRating && rating">
      <v-icon class="rating-icon" size="16">mdi-star</v-icon>
      {{ item.CommunityRating }}
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
import Vue, { PropType } from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    item: {
      type: Object as PropType<BaseItemDto>,
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
