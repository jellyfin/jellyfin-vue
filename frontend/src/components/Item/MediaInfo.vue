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
      <v-icon class="rating-icon" size="16">
        <i-mdi-star />
      </v-icon>
      {{ item.CommunityRating.toFixed(1) }}
    </span>
    <span v-if="item.Type === 'MusicAlbum' && item.ChildCount && tracks">
      {{ $t('numberTracks', { number: item.ChildCount }) }}
    </span>
    <!-- TODO: Track https://github.com/vuejs/core/pull/7306 -->
    <span v-if="item.RunTimeTicks && runtime">
      {{ getRuntimeTime(item.RunTimeTicks).value }}
    </span>
    <span v-if="item.RunTimeTicks && endsAt">
      {{ getEndsAtTime(item.RunTimeTicks).value }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getEndsAtTime, getRuntimeTime } from '@/utils/time';

withDefaults(
  defineProps<{
    item: BaseItemDto;
    year?: boolean;
    rating?: boolean;
    runtime?: boolean;
    tracks?: boolean;
    endsAt?: boolean;
  }>(),
  {
    endsAt: false
  }
);
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
