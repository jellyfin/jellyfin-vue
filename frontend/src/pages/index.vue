<template>
  <div>
    <items-carousel
      v-if="carouselItems.length > 0"
      :items="carouselItems"
      page-backdrop
      class="top-carousel">
      <template #referenceText>
        {{ $t('homeHeader.items.recentlyAdded') }}
      </template>
    </items-carousel>
    <v-container class="sections-after-header">
      <v-row
        v-for="(homeSection, index) in homeSections"
        :key="`homeSection-${index}`">
        <home-section :section="homeSection" />
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { pickBy } from 'lodash-es';
import { ImageType, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { CardShapes, getShapeFromCollectionType } from '@/utils/items';
import { clientSettingsStore, userLibrariesStore } from '@/store';
import type { HomeSection } from '@/store';
import { useRemote } from '@/composables';

const VALID_SECTIONS = new Set([
  'resume',
  'resumeaudio',
  'upnext',
  'latestmedia'
]);

const { t } = useI18n();
const remote = useRemote();
const route = useRoute();

route.meta.title = t('home');
route.meta.transparentLayout = true;

const carouselItems = (
  await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
    userId: remote.auth.currentUserId || '',
    limit: 10,
    fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio],
    enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
    imageTypeLimit: 1
  })
).data;

const userLibraries = userLibrariesStore();
const clientSettings = clientSettingsStore();

if (userLibraries.isReady) {
  // We trigger a refresh on every load of the index page, provided the library has already been fetched by the default layout. This avoid fetching the info twice when loading / the first time
  await userLibraries.refresh();
}

const homeSections = computed<HomeSection[]>(() => {
  // Filter for valid sections in Jellyfin Vue
  // TODO: Implement custom section order
  let homeSectionsArray = pickBy(
    // @ts-expect-error - No typings for this
    clientSettings.CustomPrefs,
    (value: string, key: string) => {
      return (
        value && VALID_SECTIONS.has(value) && key.startsWith('homesection')
      );
    }
  );

  if (Object.keys(homeSectionsArray).length === 0) {
    homeSectionsArray = {
      homeSection0: 'librarytiles',
      homeSection1: 'resume',
      homeSection2: 'resumeaudio',
      homeSection3: 'upnext',
      homeSection4: 'latestmedia'
    };
  }

  homeSectionsArray = Object.values(homeSectionsArray);

  const homeSections: HomeSection[] = [];

  for (const homeSection of homeSectionsArray as Array<string>) {
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
            if (excludeViewTypes.has(userView.CollectionType as string)) {
              continue;
            }

            latestMediaSections.push({
              name: 'latestLibrary',
              libraryName: userView.Name,
              libraryId: userView.Id || '',
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
.top-carousel {
  margin-top: -64px;
}

.sections-after-header {
  position: relative;
  z-index: 4;
}
</style>
