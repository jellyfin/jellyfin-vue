<template>
  <v-fade-transition>
    <v-card class="container pa-4">
      <div class="d-flex flex-column flex-grow-1">
        <v-card-title class="countdown-header pa-0">
          {{ $t('dialog.upNext.nextEpisodePlayingIn') }}
          <span class="primary--text darken-2">
            &ensp;{{ timeLeft }} {{ $t('seconds').toLowerCase() }}
          </span>
        </v-card-title>
        <v-card-subtitle class="title subtitle-1 pa-0">
          {{ nextSeriesName }} -
          {{
            $t('tvShowAbbrev', {
              seasonNumber: nextSeasonNumber,
              episodeNumber: nextEpisodeNumber
            })
          }}
          - <span v-if="$vuetify.breakpoint.xsOnly"> <br /> </span>
          {{ nextName }}
        </v-card-subtitle>
        <div>
          {{ nextRunTime }}
          <span class="pl-4">{{ $t('endsAt', { time: nextEndsAt }) }} </span>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn class="primary darken-2" @click="$emit('startNext')">
            {{ $t('dialog.upNext.startNow') }}
          </v-btn>
          <v-btn @click="$emit('hide')"> {{ $t('dialog.upNext.hide') }}</v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-fade-transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters, mapActions } from 'vuex';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  props: {
    timeLeft: {
      type: Number,
      required: true
    }
  },
  computed: {
    ...mapState('playbackManager', ['queue', 'currentItemIndex']),
    ...mapGetters('playbackManager', ['getNextItem']),
    nextSeriesName(): string {
      return this.getNextItem?.SeriesName;
    },
    nextEpisodeNumber(): number {
      return this.getNextItem?.IndexNumber;
    },
    nextSeasonNumber(): number {
      return this.getNextItem?.ParentIndexNumber;
    },
    nextRunTime(): string {
      return this.getRuntimeTime(this.getNextItem?.RunTimeTicks);
    },
    nextEndsAt(): string {
      const seconds =
        this.ticksToMs(this.getNextItem?.RunTimeTicks) + this.timeLeft * 1000;

      return this.$dateFns.format(Date.now() + seconds, 'p');
    },
    nextName(): string {
      return this.getNextItem?.Name;
    }
  },
  methods: {
    ...mapActions('playbackManager', ['setNextTrack'])
  }
});
</script>
<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.container {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 100%;
  will-change: transform, opacity;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  user-select: none;
  z-index: 6;
  -webkit-touch-callout: none;
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .container {
    width: 30em;
    margin: 0 2em 6em 0;
  }
}
.countdown-header {
  margin: 0.25em 0;
  font-weight: 500;
}
.title {
  width: 100%;
  margin: 0.25em 0 0.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
