<template>
  <div class="container">
    <div class="d-flex flex-column flex-grow-1">
      <h2 class="countdownHeader">
        Next Episode Playing in
        <span class="primary--text darken-2">{{ timeLeft }} seconds</span>
      </h2>
      <h3 class="title subtitle-1">
        {{ nextSeriesName }} - S{{ nextSeasonNumber }}:E{{
          nextEpisodeNumber
        }}
        - {{ nextName }}
      </h3>
      <div>
        {{ nextRunTime }}
        <span id="endsAt">Ends at {{ nextEndsAt }} </span>
      </div>
      <div class="d-flex justify-end align-end buttons">
        <v-btn class="primary darken-2" @click="startNext">Start Now</v-btn>
        <v-btn @click="$emit('hide')"> Hide</v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { intervalToDuration } from 'date-fns';
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
      const seconds = this.ticksToMs(this.getNextItem?.RunTimeTicks);

      return this.$dateFns.formatDuration(
        intervalToDuration({ start: 0, end: seconds }),
        { format: ['hours', 'minutes'] }
      );
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
  mounted() {
    // eslint-disable-next-line no-console
    console.log(this.getNextItem);
  },
  methods: {
    ...mapActions('playbackManager', ['setNextTrack']),
    startNext(): boolean {
      // eslint-disable-next-line no-console
      console.log('Next');
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
}
.title {
  width: 100%;
  margin: 0.25em 0 0.5em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.buttons {
  width: 29.75em;

  /*
  justify-content: end;
  align-content: flex-end;
  */

  margin-top: 1em;
}
.buttons > .v-btn {
  margin-right: 1em;
}
#endsAt {
  padding-left: 1em;
}
</style>
