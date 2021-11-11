<template>
  <div>
    <home-header />
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
import { mapActions, mapGetters, mapState } from 'vuex';
import pickBy from 'lodash/pickBy';
import { BaseItemDto } from '@jellyfin/client-axios';
import { CardShapes, getShapeFromCollectionType } from '~/utils/items';
import { HomeSection } from '~/store/homeSection';

export default Vue.extend({
  data() {
    return {
      homeSections: [] as HomeSection[]
    };
  },
  async fetch() {
    const validSections = ['resume', 'resumeaudio', 'upnext', 'latestmedia'];

    // Filter for valid sections in Jellyfin Vue
    // TODO: Implement custom section order
    let homeSectionsArray = pickBy(
      this.CustomPrefs,
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
        case 'latestmedia': {
          const latestMediaSections = [];

          let userViews: BaseItemDto[] = this.views;

          if (!userViews.length) {
            await this.$store.dispatch('userViews/refreshUserViews');
            userViews = await this.views;
          }

          if (userViews) {
            const excludeViewTypes = [
              'playlists',
              'livetv',
              'boxsets',
              'channels'
            ];

            for (const userView of userViews) {
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
        }
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
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title']),
    ...mapState('clientSettings', ['CustomPrefs']),
    ...mapState('userViews', ['views'])
  },
  mounted() {
    if (this.$fetchState.timestamp <= Date.now() - 30000) {
      this.$fetch();
    }

    this.setPageTitle({ title: this.$t('home') });
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: true });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('userViews', ['refreshUserViews']),
    ...mapGetters('userViews', ['getUserViews'])
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

.sections-after-header {
  position: relative;
  z-index: 4;
}
</style>
