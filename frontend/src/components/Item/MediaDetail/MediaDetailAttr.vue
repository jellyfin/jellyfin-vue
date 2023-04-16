<template>
  <div class="d-flex flex-row">
    <span class="mdinfo-label">{{ label }}</span>
    <span class="mdinfo-value">{{ value ?? 'Unknown' }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number | null;
}>();
</script>

<style lang="scss" scoped>
.mdinfo-label {
  display: inline-block;
  margin-right: 1rem;
  font-weight: 600;
}
.mdinfo-value {
  display: inline-block;
  font-weight: 400;
}
</style>
