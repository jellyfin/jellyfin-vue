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

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { CardShapes, fetchIndexPage, getShapeFromCollectionType } from '#/utils/items.ts';
import { usePageTitle } from '#/composables/page-title.ts';
import { userSettings } from '#/store/settings/user.ts';
import { orderItemsById } from '#/utils/ordering.ts';

definePage({
  meta: {
    layout: {
      transparent: true,
      transition: {}
    }
  }
});

interface HomeSection {
  id: string;
  title: string;
  libraryId: string;
  shape: CardShapes;
  type: 'libraries' | 'resumevideo' | 'nextup' | 'latestmedia';
}

const { t } = useTranslation();

usePageTitle(() => t('home'));

const { carousel, nextUp, views, resumeVideo, latestPerLibrary } = await fetchIndexPage();

const latestMediaSections = computed(() => {
  return views.value.map((userView) => {
    if (
      userView.CollectionType
      && !excludeViewTypes.has(userView.CollectionType)
    ) {
      return {
        id: `latestmedia:${userView.Id ?? ''}`,
        title: t('latestLibrary', { libraryName: userView.Name }),
        libraryId: userView.Id ?? '',
        shape: getShapeFromCollectionType(userView.CollectionType),
        type: 'latestmedia'
      };
    }
  }).filter((i): i is HomeSection => !isNil(i));
});

/**
 * Resolves a stored home section id to one or more renderable sections.
 */
function getConfiguredHomeSections(id: string): HomeSection[] {
  switch (id) {
    case 'smalllibrarytiles': {
      return [{
        id,
        title: t('libraries'),
        libraryId: '',
        shape: CardShapes.Thumb,
        type: 'libraries'
      }];
    }
    case 'librarybuttons': {
      return [{
        id,
        title: t('libraries'),
        libraryId: '',
        shape: CardShapes.Square,
        type: 'libraries'
      }];
    }
    case 'resumevideo': {
      return [{
        id,
        title: t('continueWatching'),
        libraryId: '',
        shape: CardShapes.Thumb,
        type: 'resumevideo'
      }];
    }
    case 'nextup': {
      return [{
        id,
        title: t('nextUp'),
        libraryId: '',
        shape: CardShapes.Thumb,
        type: 'nextup'
      }];
    }
    case 'latestmedia': {
      return latestMediaSections.value;
    }
    default: {
      return [];
    }
  }
}

const homeSections = computed<HomeSection[]>(() => {
  return userSettings.homeSections.value.flatMap(id => getConfiguredHomeSections(id));
});

/**
 * Gets the items for every home section
 */
function getHomeSectionContent(section: HomeSection): BaseItemDto[] {
  switch (section.type) {
    case 'libraries': {
      return orderItemsById(views.value, userSettings.libraryOrder.value);
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
