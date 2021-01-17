<template>
  <div class="d-inline-flex">
    <v-btn
      v-if="canPlay(item) && fab"
      fab
      color="primary"
      @click.prevent="play({ items: [item] })"
    >
      <v-icon size="36">mdi-play</v-icon>
    </v-btn>
    <v-btn
      v-if="!fab"
      :disabled="!canPlay(item)"
      class="mr-2"
      color="primary"
      min-width="8em"
      depressed
      rounded
      @click="play({ items: [item] })"
    >
      {{ $t('play') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions } from 'vuex';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    fab: {
      type: Boolean,
      default: (): boolean => {
        return false;
      }
    }
  },
  methods: {
    ...mapActions('playbackManager', ['play'])
  }
});
</script>
