<template>
  <div class="text--secondary">
    <span v-if="productionYear && year">{{ productionYear }}</span>
    <span v-if="item.OfficialRating && rating">
      <v-chip class="text-overline" small label>
        {{ item.OfficialRating }}
      </v-chip>
    </span>
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
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
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
  computed: {
    productionYear(): string | null {
      if (this.item.Status === 'Continuing') {
        return `${this.item.ProductionYear} - ${this.$t('present')}`;
      } else if (this.item.EndDate) {
        const endYear = new Date(this.item?.EndDate).toLocaleString('en-us', {
          year: 'numeric'
        });

        if (this.item.ProductionYear?.toString() === endYear) {
          return this.item.ProductionYear.toString();
        }

        return `${this.item.ProductionYear} - ${endYear}`;
      } else if (this.item.ProductionYear) {
        return this.item.ProductionYear.toString();
      }

      return null;
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
