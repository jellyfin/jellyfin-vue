<template>
  <v-btn
    class="mr-2"
    color="primary"
    min-width="8em"
    depressed
    rounded
    :disabled="disabled"
    :loading="loading"
    @click="onClick"
  >
    {{ shuffle ? $t('playback.shuffleAll') : $t('playback.playAll') }}
  </v-btn>
</template>

<script lang="ts">
import { mapActions, mapState } from 'vuex';
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
    },
    shuffle: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      loading: false
    };
  },
  computed: {
    ...mapState('playbackManager', ['status'])
  },
  watch: {
    status(): void {
      if (this.status === PlaybackStatus.playing) {
        this.loading = false;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    onClick(): void {
      if (!this.disabled) {
        this.loading = true;
        this.play({ items: this.items, startShuffled: this.shuffle });
      }
    }
  }
});
</script>
