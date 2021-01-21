<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        :disabled="disabled"
        v-bind="attrs"
        v-on="on"
        @click="onClick"
      >
        <v-icon v-if="!loading">mdi-play</v-icon>
        <v-progress-circular v-else indeterminate size="24" />
      </v-btn>
    </template>
    <span>{{ $t('playback.playAll') }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { mapActions } from 'vuex';
import Vue from 'vue';
import { PlaybackStatus } from '~/store/playbackManager';

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      loading: false
    };
  },
  computed: {
    isPlaying(): boolean {
      return (
        this.$store.state.playbackManager.status !== PlaybackStatus.stopped
      );
    }
  },
  watch: {
    isPlaying(): void {
      if (this.isPlaying) {
        this.loading = false;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    onClick(): void {
      if (!this.disabled) {
        this.loading = true;
        this.play({ items: this.items, startShuffled: false });
      }
    }
  }
});
</script>
