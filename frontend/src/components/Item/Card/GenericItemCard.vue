<template>
  <div
    :class="{
      'uno-m-2': margin
    }">
    <Component
      :is="to ? 'router-link' : 'div'"
      :to="to"
      :class="{
        'uno-color-unset uno-decoration-none': to,
        'uno-cursor-pointer': hasClick
      }">
      <div
        :class="shape"
        class="elevation-2 uno-bg-menu">
        <JSlot class="align-center card-content uno-h-full uno-w-full uno-flex uno-justify-center !uno-m-0">
          <slot name="image" />
        </JSlot>
        <JOverlay
          v-if="$slots['upper-content']?.({}).length"
          class="uno-top-0 uno-p-2">
          <span class="uno-flex uno-items-center">
            <slot name="upper-content" />
          </span>
        </JOverlay>
        <JOverlay
          v-if="overlay && hasFinePointer"
          hover
          scrim
          class="uno-flex uno-justify-center">
          <span class="uno-self-center">
            <slot name="center-content" />
          </span>
          <span class="uno-absolute uno-bottom-0 uno-right-0 uno-m-2">
            <slot name="bottom-content" />
          </span>
        </JOverlay>
        <VProgressLinear
          v-if="
            !isNil(progress) && progress > 0
          "
          :model-value="progress"
          absolute
          location="bottom" />
      </div>
    </Component>
    <div
      v-if="$slots.title || ($slots.title && $slots.subtitle)"
      class="uno-mt-2 uno-overflow-hidden uno-text-ellipsis uno-px-1 uno-text-center uno-text-nowrap">
      <a class="font-weight-medium text-truncate uno-block">
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
import { isNil } from '@jellyfin-vue/shared/validation';
import { hasFinePointer } from '#/store';
import type { CardShapes } from '#/utils/items';

const { shape, progress, overlay, to, margin } = defineProps<{
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

.card-upper-content {
  position: absolute;
  right: 0.5em;
  top: 0.5em;
  gap: 0.3em;
}

.card-content {
  overflow: hidden;
  contain: strict;
  background-size: cover;
  background-repeat: no-repeat;
  background-clip: content-box;
  background-position: center center;
  -webkit-tap-highlight-color: transparent;
}

.card-box {
  text-decoration: none;
  color: unset;
}
</style>
