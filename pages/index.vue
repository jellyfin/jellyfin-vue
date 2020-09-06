<template>
  <v-container fluid>
    <v-row
      v-for="(homeSection, homeSectionIndex) in homeSections"
      :key="homeSectionIndex"
    >
      <home-section :section="homeSection" />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { pickBy } from 'lodash';
import { getShapeFromCollectionType } from '~/utils/items';

export default Vue.extend({
  data() {
    return {
      homeSections: [
        {
          name: this.$t('continueWatching'),
          libraryId: '',
          shape: 'thumb-card',
          type: 'resume'
        },
        {
          name: this.$t('continueListening'),
          libraryId: '',
          shape: 'square-card',
          type: 'resumeaudio'
        },
        {
          name: this.$t('upNext'),
          libraryId: '',
          shape: 'thumb-card',
          type: 'upnext'
        }
      ]
    };
  },
  async created() {
    const validSections = ['resume', 'resumeaudio', 'upnext', 'latestmedia'];

    // Filter for valid sections in Jellyfin Vue
    let homeSectionsArray = pickBy(
      this.$store.state.user.displayPreferences,
      (value: string, key: string) => {
        return (
          value &&
          validSections.includes(value) &&
          key.startsWith('homesection')
        );
      }
    );

    if (homeSectionsArray) {
      // Convert to an array
      homeSectionsArray = Object.values(homeSectionsArray);

      const homeSections = [];

      for (const homeSection of homeSectionsArray as Array<string>) {
        switch (homeSection) {
          case 'latestmedia': {
            const latestMediaSections = [];

            const userViewsRequest = await this.$userViewsApi.getUserViews({
              userId: this.$auth.user.Id
            });

            if (userViewsRequest.data.Items) {
              const excludeViewTypes = [
                'playlists',
                'livetv',
                'boxsets',
                'channels'
              ];

              for (const userView of userViewsRequest.data.Items) {
                if (
                  excludeViewTypes.includes(userView.CollectionType as string)
                ) {
                  continue;
                }

                latestMediaSections.push({
                  name: `Latest ${userView.Name}`,
                  libraryId: userView.Id || '',
                  shape: getShapeFromCollectionType(userView.CollectionType),
                  type: 'latestmedia'
                });
              }

              homeSections.push(...latestMediaSections);
            }
            break;
          }
          case 'resume':
            homeSections.push({
              name: 'Continue Watching',
              libraryId: '',
              shape: 'thumb-card',
              type: 'resume'
            });
            break;
          case 'resumeaudio':
            homeSections.push({
              name: 'Continue Listening',
              libraryId: '',
              shape: 'square-card',
              type: 'resumeaudio'
            });
            break;
          case 'upnext':
            homeSections.push({
              name: 'Next Up',
              libraryId: '',
              shape: 'thumb-card',
              type: 'upnext'
            });
            break;
          default:
            break;
        }
      }

      this.homeSections = homeSections;
    }
  }
});
</script>
