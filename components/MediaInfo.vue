<template>
  <div class="text--secondary">
    <span v-if="item.ProductionYear && year">{{ item.ProductionYear }}</span>
    <span v-if="item.OfficialRating && rating">{{ item.OfficialRating }}</span>
    <span v-if="item.CommunityRating && rating"
      ><v-icon class="rating-icon" size="16">mdi-star</v-icon>
      {{ item.CommunityRating }}</span
    >
    <span v-if="item.RunTimeTicks && runtime">{{ runtimeValue }}</span>
    <span v-if="item.RunTimeTicks && endsAt">{{
      $t('endsAt', {
        time: endsAtValue
      })
    }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { intervalToDuration } from 'date-fns';
import { BaseItemDto } from '~/api';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    year: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Boolean,
      default: false
    },
    runtime: {
      type: Boolean,
      default: false
    },
    endsAt: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    runtimeValue: {
      get() {
        const seconds = this.ticksToMs(this.item.RunTimeTicks);
        return this.$dateFns.formatDuration(
          intervalToDuration({ start: 0, end: seconds }),
          {
            format: ['hours', 'minutes']
          }
        );
      }
    },
    endsAtValue: {
      get() {
        const seconds = this.ticksToMs(this.item.RunTimeTicks);
        return this.$dateFns.format(Date.now() + seconds, 'p');
      }
    }
  },
  methods: {
    getEndsAtTime(ticks: number): string {
      const ms = this.ticksToMs(ticks);
      const endTimeLong = new Date(Date.now() + ms);
      // TODO: Respect user locale when rendering time
      const endTimeShort = endTimeLong.toLocaleString(this.$i18n.locale, {
        hour: 'numeric',
        minute: 'numeric'
      });

      // TODO: Use a Date object
      return this.$t('endsAt', {
        time: endTimeShort
      }).toString();
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
