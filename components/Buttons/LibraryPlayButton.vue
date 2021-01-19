<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.breakpoint.smAndDown"
        icon
        v-bind="attrs"
        v-on="on"
        @click="onClick"
      >
        <v-icon>mdi-play</v-icon>
      </v-btn>
    </template>
    <span>{{ $t('playback.playAll') }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { mapActions } from 'vuex';
import Vue from 'vue';

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    onClick(): void {
      this.play({ items: this.items, startShuffled: false });
    }
  }
});
</script>
