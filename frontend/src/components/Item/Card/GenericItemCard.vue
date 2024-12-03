<template>
  <div :class="{ 'card-margin': margin }">
    <Component
      :is="to ? 'router-link' : 'div'"
      :to="to"
      :class="{ 'card-box': to, 'uno-cursor-pointer': hasClick }">
      <JHover v-slot="{ isHovering }">
        <div
          :class="shape"
          class="elevation-2">
          <JOverlay
            class="d-flex align-center justify-center card-content">
            <JSlot class="card-image">
              <slot
                name="image" />
            </JSlot>
          </JOverlay>
          <JOverlay
            class="d-flex justify-center align-center card-overlay"
            :class="{ 'card-overlay-hover': overlay && hasFinePointer }">
            <div class="d-flex justify-center align-center card-upper-content">
              <slot name="upper-content" />
            </div>
            <div
              v-if="(isHovering && overlay && hasFinePointer) || forceOverlay"
              class="card-overlay-hover-hidden">
              <slot name="center-content" />
              <div class="d-flex justify-center align-center card-lower-content">
                <slot name="bottom-content" />
              </div>
            </div>
            <VProgressLinear
              v-if="
                !isNil(progress) && progress > 0
              "
              :model-value="progress"
              absolute
              location="bottom" />
          </JOverlay>
        </div>
      </JHover>
    </Component>
    <div
      v-if="$slots.title || ($slots.title && $slots.subtitle)"
      class="card-text">
      <a class="font-weight-medium pa-0 mt-1 text-truncate d-block">
        <slot name="title" />
      </a>
      <a class="v-card-subtitle">
        <slot
          name="subtitle" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAttrs, computed } from 'vue';
import { isNil } from '@/utils/validation';
import { hasFinePointer } from '@/store';
import type { CardShapes } from '@/utils/items';
import JOverlay from '@/components/lib/JOverlay.vue';

const { shape, progress, overlay, forceOverlay, to, margin } = defineProps<{
  shape: CardShapes;
  /**
   * Progress to show in the bottom of the image
   */
  progress?: number;
  /**
   * Whether to show an overlay on hover
   */
  overlay?: boolean;
  /**
   * By default, the overlay DOM will be destroyed as soon as hover ends.
   * However, you can override that behaviour with this prop.
   */
  forceOverlay?: boolean;
  /**
   * Whether clicking on the card should navigate to a link
   */
  to?: string;
  /**
   * Whether to apply a margin to the card
   */
  margin?: boolean;
}>();

const attrs = useAttrs();

const hasClick = computed(() => !!attrs.onClick);
</script>

<style scoped>
.portrait-card {
  position: relative;
  padding-bottom: 150%;
  contain: strict;
  border-radius: 0.3em;
}

.thumb-card {
  position: relative;
  padding-bottom: 56.25%;
  contain: strict;
  border-radius: 0.3em;
}

.square-card {
  position: relative;
  padding-bottom: 100%;
  contain: strict;
  border-radius: 0.3em;
}

.card-image {
  width: 100%;
  height: 100%;
}

.card-upper-content {
  position: absolute;
  right: 0.5em;
  top: 0.5em;
  gap: 0.3em;
}

.card-lower-content {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
  gap: 0.3em;
}

.card-margin {
  margin: 0.6em;
}

.card-content {
  background-color: rgb(var(--v-theme-menu));
  overflow: hidden;
  margin: 0 !important;
  contain: strict;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}

.card-overlay {
  transition: all 0.2s;
}

.overlay-hover {
  transition: opacity 0.2s;
}

.card-overlay-hover-hidden {
  transition: inherit;
  opacity: 0;
}

@media (hover: hover) and (pointer: fine) {
  .card-box:hover .card-overlay-hover {
    background: rgba(var(--j-color-background), 0.5);
  }
  .card-box:hover .card-overlay-hover .card-overlay-hover-hidden {
    opacity: 1;
  }
}

.card-text {
  text-align: center;
  padding: 0 0.25em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-box {
  text-decoration: none;
  color: unset;
}
.absolute {
  position: absolute;
}
</style>
