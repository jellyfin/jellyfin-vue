<template>
  <VBtn
    class="align-self-center ma-1"
    icon
    size="small"
    variant="elevated"
    v-bind="$attrs">
    <slot name="icon" />

    <VTooltip
      v-if="$slots.tooltip"
      location="bottom">
      <slot name="tooltip" />
    </VTooltip>
  </VBtn>
</template>
