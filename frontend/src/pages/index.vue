<template>
  <div>
    <ItemsCarousel
      v-if="userLibraries.carouselItems.length > 0"
      :items="userLibraries.carouselItems"
      page-backdrop
      class="top-carousel">
      <template #referenceText>
        {{ $t('homeHeader.items.recentlyAdded') }}
      </template>
    </ItemsCarousel>
    <VContainer class="sections-after-header">
      <VRow
        v-for="(homeSection, index) in homeSections"
        :key="`homeSection-${index}`">
        <HomeSection :section="homeSection" />
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router/auto';
import { CardShapes, getShapeFromCollectionType } from '@/utils/items';
import { userLibrariesStore } from '@/store';
import type { HomeSection } from '@/store/userLibraries';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('home');
route.meta.transparentLayout = true;

const userLibraries = userLibrariesStore();

/**
 * Items are fetched at logon when switching between the 'fullpage' and 'default' layout. With the help of the
 * Suspense component at RouterView, we block navigation until the promise at the root level of the 'default' layout resolves.
 * This means that at login we have 2 promises: The one from here and the one from the default layout. Both are fired at the same time,
 * but only the result from one is enough. The 'isReady' checks wether the data is populated or not. If it's not populated,
 * we know the Promise of the default layout is still pending, so we can skip this one.
 *
 * We use onMounted so data gets updated on the fly as soon as possible without blocking navigation.
 * The disadvantage of this is that the content might change in front of the user,
 * but that's better UX than content jumping or blocking navigation.
 */
onMounted(async () => {
  if (userLibraries.isReady) {
    await userLibraries.refresh();
  }
});

const homeSections = computed<HomeSection[]>(() => {
  const homeSectionKeys = [
    'librarytiles',
    'resume',
    'resumeaudio',
    'upnext',
    'latestmedia'
  ];

  const homeSections: HomeSection[] = [];

  for (const homeSection of homeSectionKeys) {
    switch (homeSection) {
      case 'librarytiles': {
        homeSections.push({
          name: 'libraries',
          libraryId: '',
          shape: CardShapes.Thumb,
          type: 'libraries'
        });
        break;
      }
      case 'latestmedia': {
        {
          const latestMediaSections = [];

          const excludeViewTypes = new Set([
            'playlists',
            'livetv',
            'boxsets',
            'channels'
          ]);

          for (const userView of userLibraries.libraries) {
            if (
              userView.CollectionType &&
              excludeViewTypes.has(userView.CollectionType)
            ) {
              continue;
            }

            latestMediaSections.push({
              name: 'latestLibrary',
              libraryName: userView.Name,
              libraryId: userView.Id ?? '',
              shape: getShapeFromCollectionType(userView.CollectionType),
              type: 'latestmedia'
            });
          }

          homeSections.push(...latestMediaSections);
        }

        break;
      }
      case 'resume': {
        homeSections.push({
          name: 'continueWatching',
          libraryId: '',
          shape: CardShapes.Thumb,
          type: 'resume'
        });
        break;
      }
      case 'resumeaudio': {
        homeSections.push({
          name: 'continueListening',
          libraryId: '',
          shape: CardShapes.Square,
          type: 'resumeaudio'
        });
        break;
      }
      case 'upnext': {
        homeSections.push({
          name: 'nextUp',
          libraryId: '',
          shape: CardShapes.Thumb,
          type: 'upnext'
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  return homeSections;
});
</script>

<style lang="scss" scoped>
.sections-after-header {
  position: relative;
  z-index: 4;
}
</style>
