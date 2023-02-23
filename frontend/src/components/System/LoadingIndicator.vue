<template>
  <v-progress-linear
    :active="isLoading"
    indeterminate
    absolute
    location="top"
    color="primary" />
</template>

<script setup lang="ts">
import { useLoading } from '@/composables';

const { isLoading } = useLoading();
</script>
