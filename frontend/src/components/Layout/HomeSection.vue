<template>
  <swiper-section
    :title="
      section.libraryName === undefined
        ? $t(section.name)
        : $t(section.name, { libraryName: section.libraryName })
    "
    :items="items"
    :shape="section.shape" />
</template>

<script setup lang="ts">
import { watch, computed } from 'vue';
import { homeSectionStore } from '~/store';
import type { HomeSection } from '~/store/homeSection';

const props = defineProps({
  section: {
    type: Object as () => HomeSection,
    required: true
  }
});

const homeSection = homeSectionStore();

/**
 * Fetch home sections
 */
async function fetchHomeSections(): Promise<void> {
  switch (props.section.type) {
    case 'libraries': {
      break;
    }
    case 'resume': {
      await homeSection.getVideoResumes();
      break;
    }
    case 'resumeaudio': {
      await homeSection.getAudioResumes();
      break;
    }
    case 'upnext': {
      await homeSection.getUpNext(props.section.libraryId);
      break;
    }
    case 'latestmedia': {
      await homeSection.getLatestMedia(props.section.libraryId);
      break;
    }
    default: {
      break;
    }
  }
}

await fetchHomeSections();

watch(props.section, async () => {
  await fetchHomeSections();
});

const items = computed(() => {
  return homeSection.getHomeSectionContent(props.section);
});
</script>
