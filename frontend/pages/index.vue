<template>
  <div>
    <items-carousel
      v-if="carouselItems.length"
      :items="carouselItems"
      page-backdrop
      class="top-carousel"
    >
      <template #referenceText>
        {{ $t('homeHeader.items.recentlyAdded') }}
      </template>
    </items-carousel>
    <v-container class="sections-after-header">
      <v-row
        v-for="(homeSection, index) in homeSections"
        :key="`homeSection-${index}`"
      >
        <home-section :section="homeSection" :index="index" />
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import pickBy from 'lodash/pickBy';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';
import { CardShapes, getShapeFromCollectionType } from '~/utils/items';
import {
  clientSettingsStore,
  pageStore,
  userViewsStore,
  HomeSection,
  authStore
} from '~/store';

export default Vue.extend({
  // TODO: Merge asyncData and fetch once we have Nuxt 3, so we can have proper Vue 3 suspense support and have all the data
  // loaded with a complete Vue instance but with the route not being rendered until the full data is loaded
  async asyncData({ $api }) {
    const auth = authStore();

    const carouselItems = (
      await $api.userLibrary.getLatestMedia({
        userId: auth.currentUserId,
        limit: 10,
        fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio],
        enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
        imageTypeLimit: 1
      })
    ).data;

    return { carouselItems };
  },
  meta: {
    backdrop: true,
    transparentLayout: true
  },
  data() {
    return {
      homeSections: [] as HomeSection[],
      carouselItems: [] as BaseItemDto[]
    };
  },
  async fetch() {
    const validSections = ['resume', 'resumeaudio', 'upnext', 'latestmedia'];

    // Filter for valid sections in Jellyfin Vue
    // TODO: Implement custom section order
    let homeSectionsArray = pickBy(
      // @ts-expect-error - No typings for this
      this.clientSettings.CustomPrefs,
      (value: string, key: string) => {
        return (
          value &&
          validSections.includes(value) &&
          key.startsWith('homesection')
        );
      }
    );

    if (!Object.keys(homeSectionsArray).length) {
      homeSectionsArray = {
        homeSection0: 'librarytiles',
        homeSection1: 'resume',
        homeSection2: 'resumeaudio',
        homeSection3: 'upnext',
        homeSection4: 'latestmedia'
      };
    }

    // Convert to an array
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
        case 'latestmedia':
          {
            const latestMediaSections = [];

            if (!this.userViews.views) {
              await this.userViews.refreshUserViews();
            }

            const excludeViewTypes = [
              'playlists',
              'livetv',
              'boxsets',
              'channels'
            ];

            for (const userView of this.userViews.views) {
              if (
                excludeViewTypes.includes(userView.CollectionType as string)
              ) {
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
        case 'resume':
          homeSections.push({
            name: 'continueWatching',
            libraryId: '',
            shape: CardShapes.Thumb,
            type: 'resume'
          });
          break;
        case 'resumeaudio':
          homeSections.push({
            name: 'continueListening',
            libraryId: '',
            shape: CardShapes.Square,
            type: 'resumeaudio'
          });
          break;
        case 'upnext':
          homeSections.push({
            name: 'nextUp',
            libraryId: '',
            shape: CardShapes.Thumb,
            type: 'upnext'
          });
          break;
        default:
          break;
      }
    }

    this.homeSections = homeSections;
  },
  head() {
    return {
      title: this.page.title
    };
  },
  computed: {
    ...mapStores(clientSettingsStore, pageStore, userViewsStore)
  },
  mounted() {
    if (this.$fetchState.timestamp <= Date.now() - 30000) {
      this.$fetch();
    }

    this.page.title = this.$t('home');
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .home-header-margin {
    margin-top: -64px;
  }
}

.top-carousel {
  margin-top: -64px;
}

.sections-after-header {
  position: relative;
  z-index: 4;
}
</style>
