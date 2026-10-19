<template>
  <VProgressLinear
    :active="isLoading"
    indeterminate
    class="uno-top-0 uno-z-2000 !uno-fixed"
    color="primary" />
</template>

<script setup lang="ts">
import { useLoading } from '#/composables/use-loading.ts';

const { isLoading } = useLoading();
</script>
