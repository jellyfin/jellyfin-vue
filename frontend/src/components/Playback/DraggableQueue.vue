<template>
  <v-list-group class="list-group">
    <draggable v-model="queue" v-bind="dragOptions" class="list-draggable">
      <template v-for="(item, index) in queue" :key="`${item.Id}-${index}`">
        <v-hover v-slot="{ isHovering, props: hoverProps }" ref="listItems">
          <v-list-item v-bind="hoverProps" @click="onClick(index)">
            <v-list-item-action
              v-if="!isHovering"
              class="list-group-item d-flex justify-center d-flex transition"
              :class="{ 'text-primary font-weight-bold': isPlaying(index) }">
              {{ index + 1 }}
            </v-list-item-action>
            <v-list-item-action v-else class="justify-center d-flex">
              <v-icon>
                <i-mdi-drag-horizontal />
              </v-icon>
            </v-list-item-action>
            <v-avatar class="list-group-item">
              <blurhash-image :item="item" />
            </v-avatar>

            <v-list-item-title
              :class="{
                'text-primary font-weight-bold': isPlaying(index)
              }"
              class="text-truncate ml-2 list-group-item transition">
              {{ item.Name }}
            </v-list-item-title>
            <v-list-item-subtitle
              v-if="getArtists(item)"
              class="ml-2 list-group-item transition"
              :class="{
                'text-primary font-weight-bold': isPlaying(index)
              }">
              {{ getArtists(item) }}
            </v-list-item-subtitle>

            <v-list-item-action v-hide="isPlaying(index)">
              <like-button :item="item" />
            </v-list-item-action>
            <v-list-item-action class="mr-2">
              <item-menu :item="item" queue />
            </v-list-item-action>
          </v-list-item>
        </v-hover>
      </template>
    </draggable>
  </v-list-group>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, onMounted, ref } from 'vue';
import { VHover } from 'vuetify/lib/components/VHover/index';
import { playbackManagerStore } from '@/store';

const dragOptions = {
  animation: 500,
  delay: 0,
  group: false,
  dragoverBubble: true,
  ghostClass: 'ghost'
};

const listItems = ref<InstanceType<typeof VHover>[] | undefined>(undefined);

const playbackManager = playbackManagerStore();

const queue = computed({
  get() {
    return playbackManager.queue;
  },
  set(newValue: BaseItemDto[]) {
    playbackManager.setNewQueue(
      newValue.map((item) => item.Id).filter((id): id is string => !!id)
    );
  }
});

onMounted(() => {
  const reference = listItems.value;
  const currentItemId = playbackManager.currentItem?.Id || '';

  if (reference) {
    const element = reference.find(
      (v) => v.$.vnode.key === `${currentItemId}-${reference.indexOf(v)}`
    );

    if (element && element.$el) {
      /**
       * As the queue opening has a transition effect, el.$el.scrollIntoView() doesn't work directly,
       * as the parent DOM node is not fully rendered while the transition is taking place
       * (so scrollIntoView() doesn't know exactly what to scroll).
       *
       * The browser always give full priority to the DOM manipulation and painting process,
       * while the setTimeout runs with lower priority. This assures us that the view will be scrolled to
       * the currently playing element as soon as all the DOM operations and transitions are over.
       */
      window.setTimeout(() => {
        element.$el.scrollIntoView();
      });
    }
  }
});

/**
 * Checks if the item in the current position is playing
 */
function isPlaying(index: number): boolean {
  return index === playbackManager.currentItemIndex;
}

/**
 * Gets the artists of the current item
 */
function getArtists(item: BaseItemDto): string | undefined {
  return item.Artists ? item.Artists.join(', ') : undefined;
}

/**
 * Click handler for list items
 */
function onClick(index: number): void {
  playbackManager.currentItemIndex = index;
}
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
