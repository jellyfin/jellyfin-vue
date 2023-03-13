<template>
  <div class="ma-1">
    <v-btn
      class="align-self-center"
      v-bind="$props"
      icon
      size="small"
      variant="elevated">
      <slot name="icon" />

      <v-tooltip v-if="$slots.tooltip" activator="parent" location="bottom">
        <slot name="tooltip" />
      </v-tooltip>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string;
    disabled?: boolean;
  }>(),
  { color: '', disabled: false }
);
</script>
