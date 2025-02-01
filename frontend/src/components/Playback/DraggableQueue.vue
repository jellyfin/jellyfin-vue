<template>
  <span ref="container">
    <template
      v-for="(item, index) of playbackManager.queue.value"
      :key="item.Id">
      <JHover v-slot="{ isHovering }">
        <VListItem
          :title="item.Name ?? ''"
          :subtitle="getArtists(item)"
          class="uno-cursor-grab"
          :class="{ 'text-primary font-weight-bold': isPlaying(index) }"
          @click="playbackManager.currentItemIndex.value = index">
          <template #prepend>
            <VListItemAction
              :key="index"
              class="uno-min-w-10"
              start>
              <template v-if="!isHovering">
                {{ index + 1 }}
              </template>
              <JIcon
                v-else
                class="i-mdi:drag-horizontal" />
            </VListItemAction>
            <VAvatar>
              <BlurhashImage :item="item" />
            </VAvatar>
          </template>
          <template #append>
            <LikeButton
              v-hide="isPlaying(index)"
              :item="item" />
            <ItemMenu
              v-hide="isPlaying(index)"
              :item="item"
              queue />
          </template>
        </VListItem>
      </JHover>
    </template>
  </span>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import Sortable from 'sortablejs';
import { watch, useTemplateRef, onScopeDispose } from 'vue';
import { isNumber } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager';

let sortable: Sortable | undefined;
const container = useTemplateRef<HTMLSpanElement>('container');

/**
 * Destroys the sortable instance
 */
function destroy(): void {
  if (sortable) {
    sortable.destroy();
    sortable = undefined;
  }
}

/**
 * Checks if the item in the current position is playing
 */
function isPlaying(index: number): boolean {
  return index === playbackManager.currentItemIndex.value;
}

/**
 * Gets the artists of the item
 */
function getArtists(item: BaseItemDto): string | undefined {
  return item.Artists ? item.Artists.join(', ') : undefined;
}

watch(container, () => {
  destroy();

  if (container.value) {
    sortable = new Sortable(container.value, {
      animation: 500,
      delay: 0,
      dragoverBubble: true,
      onUpdate(e): void {
        const oldIndex = e.oldIndex;

        if (isNumber(oldIndex)) {
          const item = playbackManager.queue.value[oldIndex];

          if (item?.Id && isNumber(e.newIndex)) {
            playbackManager.changeItemPosition(item.Id, e.newIndex);
          }
        }
      }
    });
  }
});

onScopeDispose(() => destroy());
</script>
