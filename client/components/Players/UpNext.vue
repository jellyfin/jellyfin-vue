<template>
  <v-container
    v-if="visible"
    class="up-next-dialog pointer-events-none pa-lg-6"
  >
    <v-row>
      <v-col
        cols="12"
        offset-md="6"
        md="6"
        offset-lg="8"
        lg="4"
        offset-xl="9"
        xl="3"
      >
        <v-card class="pointer-events-all">
          <v-card-title class="text-h6">
            <i18n path="dialog.upNext.nextItemPlayingIn" tag="span">
              <template #time>
                <span class="primary--text darken-2">
                  {{ $tc('units.time.seconds', currentItemTimeLeft) }}
                </span>
              </template>
            </i18n>
          </v-card-title>
          <v-card-subtitle class="text-truncate subtitle-1">
            <span v-if="getCurrentItem.Type === 'Episode'">
              {{ getNextItem.SeriesName }} -
              {{
                $t('seasonEpisodeAbbrev', {
                  seasonNumber: getNextItem.ParentIndexNumber,
                  episodeNumber: getNextItem.IndexNumber
                })
              }}
              <span v-if="$vuetify.breakpoint.smAndUp"> - </span> <br v-else />
              {{ getNextItem.Name }}
            </span>
            <span v-if="getCurrentItem.Type === 'Movie'">
              {{ getNextItem.Name }}
            </span>
          </v-card-subtitle>
          <v-card-text>
            <span>
              {{ getRuntimeTime(getNextItem.RunTimeTicks) }}
              <span class="pl-4"
                >{{
                  $t('endsAt', {
                    time: getEndsAtTime(getNextItem.RunTimeTicks)
                  })
                }}
              </span>
            </span>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn class="primary darken-2" depressed @click="setNextTrack()">
              {{ $t('dialog.upNext.startNow') }}
            </v-btn>
            <v-btn depressed outlined @click="isHiddenByUser = true">
              {{ $t('dialog.upNext.hide') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapState } from 'vuex';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  data() {
    return {
      isHiddenByUser: false
    };
  },
  computed: {
    ...mapState('playbackManager', [
      'currentItemIndex',
      'currentTime',
      'isMinimized'
    ]),
    ...mapGetters('playbackManager', [
      'getCurrentlyPlayingMediaType',
      'getNextItem',
      'getCurrentItem',
      'setNextTrack'
    ]),
    currentItemDuration(): number {
      return this.ticksToMs(this.getCurrentItem?.RunTimeTicks) / 1000;
    },
    currentItemTimeLeft(): number {
      return Math.round(this.currentItemDuration - this.currentTime);
    },
    visible(): boolean {
      if (
        this.isMinimized ||
        this.isHiddenByUser ||
        this.getCurrentlyPlayingMediaType !== 'Video' ||
        !this.getNextItem
      ) {
        return false;
      }

      if (this.currentItemTimeLeft <= this.nextUpDuration) {
        return true;
      }

      return false;
    },
    nextUpDuration(): number {
      // If longer than 5 hours, set the duration to 9 minutes
      if (this.currentItemDuration >= 5 * 60 * 60) {
        return 540;
      }
      // If longer than 2 hours, set the duration to 3.5 minutes
      else if (this.currentItemDuration >= 2 * 60 * 60) {
        return 210;
      }
      // If longer than 45 minutes, set the duration to 2 minutes
      else if (this.currentItemDuration >= 45 * 60) {
        return 120;
      }

      return 45;
    }
  },
  watch: {
    currentItemIndex(): void {
      this.isHiddenByUser = false;
    },
    visible(): void {
      this.$emit('change', this.visible);
    }
  }
});
</script>
<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.up-next-dialog {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 9999;
}
</style>
