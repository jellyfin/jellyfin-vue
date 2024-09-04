<template>
  <div>
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
      <VIcon
        class="rating-icon"
        size="16">
        <IMdiStar />
      </VIcon>
      {{ item.CommunityRating.toFixed(1) }}
    </span>
    <span v-if="item.Type === 'MusicAlbum' && item.ChildCount && tracks">
      {{ $t('numberTracks', { number: item.ChildCount }) }}
    </span>
    <span v-if="item.RunTimeTicks && runtime">
      {{ getRuntimeTime(item.RunTimeTicks) }}
    </span>
    <span v-if="item.RunTimeTicks && endsAt">
      {{ getEndsAtTime(item.RunTimeTicks) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getEndsAtTime, getRuntimeTime } from '@/utils/time';

const { item, year, rating, runtime, tracks, endsAt } = defineProps<{
  item: BaseItemDto;
  year?: boolean;
  rating?: boolean;
  runtime?: boolean;
  tracks?: boolean;
  endsAt?: boolean;
}>();
</script>

<style scoped>
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
