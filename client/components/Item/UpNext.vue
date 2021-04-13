<template>
  <v-fade-transition>
    <v-card class="container white--text pa-4">
      <div class="d-flex flex-column flex-grow-1">
        <v-card-title class="text-h6 pa-0 my-1 mx-0">
          {{ $t('dialog.upNext.nextEpisodePlayingIn') }}
          <span class="primary--text darken-2">
            &ensp;{{ timeLeft }} {{ $t('seconds').toLowerCase() }}
          </span>
        </v-card-title>
        <v-card-subtitle class="mt-1 mx-0 mb-2 text-truncate subtitle-1 pa-0">
          {{ getNextItem.SeriesName }} -
          {{
            $t('tvShowAbbrev', {
              seasonNumber: getNextItem.ParentIndexNumber,
              episodeNumber: getNextItem.IndexNumber
            })
          }}
          <span v-if="$vuetify.breakpoint.smAndUp"> - </span> <br v-else />
          {{ getNextItem.Name }}
        </v-card-subtitle>
        <div>
          {{ getRuntimeTime(getNextItem.RunTimeTicks) }}
          <span class="pl-4"
            >{{ $t('endsAt', { time: nextEndsAt(getNextItem.RunTimeTicks) }) }}
          </span>
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
import { mapGetters } from 'vuex';
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
    ...mapGetters('playbackManager', ['getNextItem'])
  },
  methods: {
    nextEndsAt(runtimeTicks: number): string {
      const seconds = this.ticksToMs(runtimeTicks) + this.timeLeft * 1000;

      return this.$dateFns.format(Date.now() + seconds, 'p');
    }
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
  background-color: rgba(map-get($shades, 'black'), 0.7);
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
</style>
