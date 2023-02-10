<template>
  <div class="ma-1">
    <v-btn
      class="align-self-center"
      icon
      size="small"
      :color="color"
      variant="elevated"
      :disabled="disabled">
      <slot name="icon" />

      <v-tooltip location="bottom">
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
