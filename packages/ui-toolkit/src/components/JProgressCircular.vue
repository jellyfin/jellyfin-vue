<template>
  <svg
    class="uno-object-contain uno-aspect-square uno-w-15 uno-content-visibility-auto"
    :class="{
      'j-progress-circular--indeterminate': indeterminate,
    }"
    :style="{
      '--j-progresscircular-radius': toPx(MAGIC_RADIUS_CONSTANT),
      transform: `rotate(-90deg)`
    }"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 100 100"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="indeterminate ? undefined : normalizedValue"
    :aria-valuetext="indeterminate ? t('loading') : t('percentCompleted', { value: normalizedValue })"
    v-bind="getBaseProps($attrs)">
    <circle
      class="j-progress-circular--underlay uno-stroke-current uno-z-1"
      fill="transparent"
      cx="50%"
      cy="50%"
      :r="MAGIC_RADIUS_CONSTANT"
      :stroke-width
      :stroke-dasharray="CIRCUMFERENCE"
      stroke-dashoffset="0" />
    <text
      v-if="$slots.default || (innerProgress && !indeterminate)"
      x="50%"
      y="50%"
      class="uno-fill-current j-progress-circular--text"
      dominant-baseline="middle"
      text-anchor="middle">
      <template v-if="$slots.default?.({}).length">
        <slot />
      </template>
      <template v-else>
        {{ normalizedValue }}%
      </template>
    </text>
    <circle
      class="j-progress-circular--overlay uno-transform-origin-center uno-stroke-current uno-stroke-cap-round uno-z-2"
      fill="transparent"
      cx="50%"
      cy="50%"
      :r="MAGIC_RADIUS_CONSTANT"
      :stroke-width
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset />
  </svg>
</template>

<script lang="ts">
// Changing this value will change the proportions of the circle accordingly
const MAGIC_RADIUS_CONSTANT = 18;
const strokeWidth = MAGIC_RADIUS_CONSTANT * 0.3;
const CIRCUMFERENCE = 2 * Math.PI * MAGIC_RADIUS_CONSTANT;
</script>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed } from 'vue';
import { clamp, toPx } from '#/util/helpers';
import { getBaseProps } from '#/util/props';

const { indeterminate, innerProgress, value = 0 } = defineProps<{
  indeterminate?: boolean;
  /**
   * Shows the progress in the inner of the circle
   */
  innerProgress?: boolean;
  value?: number;
}>();

const normalizedValue = computed(() => clamp(value, 0, 100));
const strokeDashoffset = computed(() => toPx(CIRCUMFERENCE * (1 - normalizedValue.value / 100)));
const { t } = useTranslation();
</script>

<style scoped>
@keyframes progress-circular-dash {
  0% {
    stroke-dasharray: calc(var(--j-progresscircular-radius) * 0.05) calc(var(--j-progresscircular-radius) * 10);
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: calc(var(--j-progresscircular-radius) * 5) calc(var(--j-progresscircular-radius) * 10);
    stroke-dashoffset: calc(var(--j-progresscircular-radius) * -0.75);
  }
  to {
    stroke-dasharray: calc(var(--j-progresscircular-radius) * 5) calc(var(--j-progresscircular-radius) * 10);
    stroke-dashoffset: calc(var(--j-progresscircular-radius) * -6.2);
  }
}

@keyframes progress-circular-rotate {
  to {
    transform: rotate(270deg);
  }
}

.j-progress-circular--text {
  font-size: calc(var(--j-progresscircular-radius) * 0.5);
}

.j-progress-circular--overlay {
  transition: all 1.4s ease-in-out, stroke-width;
}

.j-progress-circular--underlay {
  color: rgba(var(--j-border-color), var(--j-border-opacity));
}

.j-progress-circular--indeterminate .j-progress-circular--overlay {
  stroke-dasharray: calc(var(--j-progresscircular-radius) * 1.25) calc(var(--j-progresscircular-radius) * 10);
  stroke-dashoffset: 0;
  animation: 1.4s ease-in-out infinite progress-circular-dash,
    1.4s linear infinite progress-circular-rotate;
  transform: rotate(-90deg);
}
</style>
