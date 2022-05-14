<template>
  <v-list-item-group class="list-group">
    <draggable v-model="queue" v-bind="dragOptions" class="list-draggable">
      <v-hover
        v-for="(item, index) in queue"
        :key="`${item.Id}-${index}`"
        v-slot="{ hover }"
      >
        <v-list-item ripple @click="onClick(index)">
          <v-list-item-action
            v-if="!hover"
            class="list-group-item d-flex justify-center d-flex transition"
            :class="{ 'primary--text font-weight-bold': isPlaying(index) }"
          >
            {{ index + 1 }}
          </v-list-item-action>
          <v-list-item-action v-else class="justify-center d-flex">
            <v-icon>mdi-drag-horizontal</v-icon>
          </v-list-item-action>
          <v-list-item-avatar tile class="list-group-item">
            <blurhash-image :item="item" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title
              :class="{
                'primary--text font-weight-bold': isPlaying(index)
              }"
              class="text-truncate ml-2 list-group-item transition"
            >
              {{ item.Name }}
            </v-list-item-title>
            <v-list-item-subtitle
              v-if="getArtists(item)"
              class="ml-2 list-group-item transition"
              :class="{
                'primary--text font-weight-bold': isPlaying(index)
              }"
            >
              {{ getArtists(item) }}
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action v-hide="isPlaying(index)">
            <like-button :item="item" />
          </v-list-item-action>
          <v-list-item-action v-hide="isPlaying(index)" class="mr-2">
            <v-btn icon @click="playbackManager.removeFromQueue(item.Id)">
              <v-icon>mdi-playlist-minus</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-hover>
    </draggable>
  </v-list-item-group>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import { playbackManagerStore } from '~/store';

export default Vue.extend({
  data() {
    return {
      dragOptions: {
        animation: 500,
        delay: 0,
        group: false,
        dragoverBubble: true,
        ghostClass: 'ghost'
      }
    };
  },
  computed: {
    ...mapStores(playbackManagerStore),
    queue: {
      get(): BaseItemDto[] {
        return this.playbackManager.getQueueItems;
      },
      set(newValue: BaseItemDto[]): void {
        this.playbackManager.setNewQueue(
          newValue.map((item) => {
            return item.Id as string;
          })
        );
      }
    }
  },
  methods: {
    isPlaying(index: number): boolean {
      return index === this.playbackManager.currentItemIndex;
    },
    getArtists(item: BaseItemDto): string | null {
      if (item.Artists) {
        return item.Artists.join(', ');
      } else {
        return null;
      }
    },
    onClick(index: number): void {
      this.playbackManager.setCurrentIndex(index);
    }
  }
});
</script>

<style lang="scss" scoped>
.transition {
  transition: all 0.15s ease-in;
}

.list-group {
  margin: 0 !important;
}

.ghost {
  opacity: 0;
}

.list-draggable {
  user-select: none;
  min-height: 20px;
}

.list-group-item {
  cursor: grab;
}
</style>
