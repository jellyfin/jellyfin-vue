<template>
  <SwiperSection
    :title="section.title"
    :items="items"
    :shape="section.shape" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { userLibrariesStore } from '@/store';
import type { HomeSection } from '@/store/userLibraries';

const props = defineProps<{ section: HomeSection }>();

const userLibraries = userLibrariesStore();
const items = computed(() => {
  return userLibraries.getHomeSectionContent(props.section);
});
</script>
