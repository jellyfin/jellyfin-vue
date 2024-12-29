<template>
  <VProgressLinear
    :active="isLoading"
    indeterminate
    absolute
    location="top"
    color="primary" />
</template>

<script setup lang="ts">
import { useLoading } from '#/composables/use-loading';

const { isLoading } = useLoading();
</script>
