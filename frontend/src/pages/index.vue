<template>
  <div>
    <ItemsCarousel
      v-if="carousel.length"
      :items="carousel"
      page-backdrop>
      <template #referenceText>
        {{ $t('recentlyAdded') }}
      </template>
    </ItemsCarousel>
    <VContainer class="sections-after-header">
      <VRow
        v-for="(homeSection, index) in homeSections"
        :key="`homeSection-${index}`">
        <SwiperSection
          :title="homeSection.title"
          :items="getHomeSectionContent(homeSection)"
          :shape="homeSection.shape" />
      </VRow>
    </VContainer>
  </div>
</template>

<script lang="ts">
const excludeViewTypes = new Set([
  'playlists',
  'livetv',
  'boxsets',
  'channels'
]);
</script>

<route lang="yaml">
meta:
  layout:
    transparent: true
</route>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { isNil } from '@/utils/validation';
import { CardShapes, fetchIndexPage, getShapeFromCollectionType } from '@/utils/items';

interface HomeSection {
  title: string;
  libraryId: string;
  shape: CardShapes;
  type: 'libraries' | 'resumevideo' | 'nextup' | 'latestmedia';
}

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('home');

const { carousel, nextUp, views, resumeVideo, latestPerLibrary } = await fetchIndexPage();

const latestMediaSections = computed(() => {
  return views.value.map((userView) => {
    if (
      userView.CollectionType
      && !excludeViewTypes.has(userView.CollectionType)
    ) {
      return {
        title: t('latestLibrary', { libraryName: userView.Name }),
        libraryId: userView.Id ?? '',
        shape: getShapeFromCollectionType(userView.CollectionType),
        type: 'latestmedia'
      };
    }
  }).filter((i): i is HomeSection => !isNil(i));
});

const homeSections = computed<HomeSection[]>(() => {
  return [
    /**
     * Library tiles
     */
    {
      title: t('libraries'),
      libraryId: '',
      shape: CardShapes.Thumb,
      type: 'libraries'
    },
    /**
     * Resume video
     */
    {
      title: t('continueWatching'),
      libraryId: '',
      shape: CardShapes.Thumb,
      type: 'resumevideo'
    },
    /**
     * Next up
     */
    {
      title: t('nextUp'),
      libraryId: '',
      shape: CardShapes.Thumb,
      type: 'nextup'
    },
    /**
     * Latest media
     */
    ...latestMediaSections.value
  ];
});

/**
 * Gets the items for every home section
 */
function getHomeSectionContent(section: HomeSection): BaseItemDto[] {
  switch (section.type) {
    case 'libraries': {
      return views.value;
    }
    case 'resumevideo': {
      return resumeVideo.value;
    }
    case 'nextup': {
      return nextUp.value;
    }
    case 'latestmedia': {
      return latestPerLibrary.get(section.libraryId)?.value ?? [];
    }
    default: {
      return [];
    }
  }
};
</script>

<style scoped>
.sections-after-header {
  position: relative;
  z-index: 4;
}
</style>
