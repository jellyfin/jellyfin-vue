<template>
  <span id="draggable-queue">
    <template v-for="(item, index) of playbackManager.queue" :key="item.Id">
      <v-hover v-slot="{ isHovering, props: hoverProps }">
        <v-list-item
          v-bind="hoverProps"
          :title="item.Name ?? ''"
          :subtitle="getArtists(item)"
          class="grab-cursor"
          :class="{ 'text-primary font-weight-bold': isPlaying(index) }"
          @click="playbackManager.currentItemIndex = index">
          <template #prepend>
            <v-list-item-action :key="index" start>
              <v-icon>
                <template v-if="!isHovering">
                  {{ index + 1 }}
                </template>
                <i-mdi-drag-horizontal v-else />
              </v-icon>
            </v-list-item-action>
            <v-avatar>
              <blurhash-image :item="item" />
            </v-avatar>
          </template>
          <template #append>
            <like-button v-hide="isPlaying(index)" :item="item" />
            <item-menu v-hide="isPlaying(index)" :item="item" queue />
          </template>
        </v-list-item>
      </v-hover>
    </template>
  </span>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { onMounted, onBeforeUnmount } from 'vue';
import { VHover } from 'vuetify/lib/components/VHover/index';
import { playbackManagerStore } from '@/store';

let sortable: Sortable | undefined;
const playbackManager = playbackManagerStore();

onMounted(() => {
  const target = document.querySelector('#draggable-queue');

  if (!target || !(target instanceof HTMLElement)) {
    throw new Error(
      'The expected DOM tree for the sortable queue has been changed'
    );
  }

  sortable = new Sortable(target, {
    animation: 500,
    delay: 0,
    dragoverBubble: true,
    onUpdate(e): void {
      const oldIndex = e.oldIndex;

      if (typeof oldIndex === 'number') {
        const item = playbackManager.queue[oldIndex];

        if (item && item.Id && typeof e.newIndex === 'number') {
          playbackManager.changeItemPosition(item.Id, e.newIndex);
        }
      }
    }
  });
});

onBeforeUnmount(() => {
  if (sortable) {
    sortable.destroy();
    sortable = undefined;
  }
});

/**
 * Checks if the item in the current position is playing
 */
function isPlaying(index: number): boolean {
  return index === playbackManager.currentItemIndex;
}

/**
 * Gets the artists of the item
 */
function getArtists(item: BaseItemDto): string | undefined {
  return item.Artists ? item.Artists.join(', ') : undefined;
}
</script>

<style lang="scss" scoped>
.grab-cursor {
  cursor: grab;
}
</style>
