<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!$vuetify.breakpoint.smAndDown"
        icon
        v-bind="attrs"
        v-on="on"
        @click="onClick"
      >
        <v-icon>mdi-shuffle</v-icon>
      </v-btn>
    </template>
    <span>{{ $t('playback.shuffleAll') }}</span>
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
      this.play({ items: this.items, startShuffled: true });
    }
  }
});
</script>
