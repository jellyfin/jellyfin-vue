<template>
  <v-card class="container">
    <div class="d-flex flex-column flex-grow-1">
      <v-card-title class="countdownHeader">
        {{ $t('dialog.upNext.nextEpisodePlayingIn') }}
        <span class="primary--text darken-2">
          &ensp;{{ timeLeft }} {{ $t('seconds') }}
        </span>
      </v-card-title>
      <v-card-subtitle class="title subtitle-1">
        {{ nextSeriesName }} -
        {{
          $t('tvShowAbbrev', {
            seasonNumber: nextSeasonNumber,
            episodeNumber: nextEpisodeNumber
          })
        }}
        - {{ nextName }}
      </v-card-subtitle>
      <div>
        {{ nextRunTime }}
        <span id="endsAt">{{ $t('endsAt', { time: nextEndsAt }) }} </span>
      </div>
      <v-card-actions>
        <v-spacer />
        <v-btn class="primary darken-2" @click="startNext">
          {{ $t('dialog.upNext.startNow') }}
        </v-btn>
        <v-btn @click="$emit('hide')"> {{ $t('dialog.upNext.hide') }}</v-btn>
      </v-card-actions>
    </div>
  </v-card>
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
  data() {
    return {
      source: ''
    };
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
    ...mapActions('playbackManager', ['setNextTrack']),
    startNext(): boolean {
      this.setNextTrack();
      return true;
    }
  }
});
</script>
<style scoped>
.container {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 30em;
  padding: 1em;
  margin: 0 2em 6em 0;
  display: flex;
  flex-direction: column;
  will-change: transform, opacity;
  transition: opacity 300ms ease-out;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  user-select: none;
  z-index: 6;
  -webkit-touch-callout: none;
}
.countdownHeader {
  margin: 0.25em 0;
  font-weight: 500;
  padding: 0;
}
.title {
  width: 100%;
  margin: 0.25em 0 0.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0;
}

#endsAt {
  padding-left: 1em;
}
</style>
