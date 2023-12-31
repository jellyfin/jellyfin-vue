<template>
  <SwiperSection
    :title="section.title"
    :items="items"
    :shape="section.shape" />
</template>

<script setup lang="ts">
import { HomeSection, userLibraries } from '@/store/userLibraries';
import { computed } from 'vue';

const props = defineProps<{ section: HomeSection }>();

const items = computed(() => {
  return userLibraries.getHomeSectionContent(props.section);
});
</script>
