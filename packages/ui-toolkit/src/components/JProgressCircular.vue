<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="{
      'j-progress-circular--indeterminate': indeterminate,
    }"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="indeterminate || !model ? undefined : Math.max(0, Math.min(model, 100))">
    <circle
      class="j-progress-circular__underlay"
      fill="transparent"
      cx="50%"
      cy="50%"
      :r="MAGIC_RADIUS_CONSTANT"
      :stroke-width
      :stroke-dasharray="CIRCUMFERENCE"
      stroke-dashoffset="0" />
    <circle
      class="j-progress-circular--overlay"
      fill="transparent"
      cx="50%"
      cy="50%"
      :r="MAGIC_RADIUS_CONSTANT"
      :stroke-width
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset="`${CIRCUMFERENCE}px`" />
  </svg>
</template>

<script setup lang="ts">
const { indeterminate } = defineProps<{
  indeterminate?: boolean;
}>();
const model = defineModel<number>();

const strokeWidth = 6;
const MAGIC_RADIUS_CONSTANT = 20;
const CIRCUMFERENCE = 2 * Math.PI * MAGIC_RADIUS_CONSTANT;
</script>

<style scoped>
@keyframes progress-circular-dash {
  0% {
    stroke-dasharray: 1 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 100 200;
    stroke-dashoffset: -15px;
  }
  to {
    stroke-dasharray: 100 200;
    stroke-dashoffset: -124px;
  }
}

@keyframes progress-circular-rotate {
  to {
    transform: rotate(270deg);
  }
}

.j-progress-circular--overlay {
  stroke: currentColor;
  z-index: 2;
  transition: all 1.4s ease-in-out, stroke-width;
}

.j-progress-circular__underlay {
  color: rgba(var(--j-border-color), var(--j-border-opacity));
  stroke: currentColor;
  z-index: 1;
}

.j-progress-circular--indeterminate .j-progress-circular--overlay {
  stroke-dasharray: 25 200;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  transform-origin: 50%;
  animation: 1.4s ease-in-out infinite progress-circular-dash,
    1.4s linear infinite progress-circular-rotate;
  transform: rotate(-90deg);
}

</style>
