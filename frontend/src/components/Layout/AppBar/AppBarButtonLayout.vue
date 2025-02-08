<template>
  <JTooltip
    v-if="$slots.tooltip"
    position="bottom">
    <VBtn
      class="align-self-center ma-1"
      icon
      size="small"
      variant="elevated"
      v-bind="$attrs">
      <slot name="icon" />
    </VBtn>
    <template #content>
      <slot name="tooltip" />
    </template>
  </JTooltip>
</template>
