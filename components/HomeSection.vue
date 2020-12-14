<template>
  <div style="width: 100%">
    <skeleton-home-section v-if="loading" :card-shape="section.shape" />
    <v-col v-show="items && items.length > 0" class="home-section">
      <h1
        class="text-h5 font-weight-light header"
        :class="{ 'header-white-mode': !$vuetify.theme.dark }"
      >
        <span>{{ section.name }}</span>
      </h1>

      <vueper-slides
        :bullets="false"
        :bullets-outside="false"
        :arrows-outside="false"
        :visible-slides="section.shape === 'thumb-card' ? 4 : 8"
        :slide-multiple="true"
        :breakpoints="breakpoints"
        fixed-height="true"
      >
        <vueper-slide v-for="item in items" :key="item.Id">
          <template #content>
            <card :shape="section.shape" :item="item" />
          </template>
        </vueper-slide>

        <template #arrow-left>
          <v-btn icon large>
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </template>

        <template #arrow-right>
          <v-btn icon large>
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
      </vueper-slides>
    </v-col>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapState, mapActions } from 'vuex';
import { AppState } from '~/store';

export default Vue.extend({
  props: {
    section: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      breakpoints: {
        600: {
          visibleSlides: this.section.shape === 'thumb-card' ? 2 : 3
        },
        960: {
          visibleSlides: this.section.shape === 'thumb-card' ? 3 : 4
        },
        1264: {
          visibleSlides: this.section.shape === 'thumb-card' ? 3 : 6
        },
        1904: {
          visibleSlides: this.section.shape === 'thumb-card' ? 4 : 8
        }
      },
      loading: true
    };
  },
  computed: mapState<AppState>({
    items(state: AppState): BaseItemDto[] {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      switch (this.section.type) {
        case 'libraries':
          return state.homeSection.libraries;
        case 'resume':
          return state.homeSection.videoResumes;
        case 'resumeaudio':
          return state.homeSection.audioResumes;
        case 'upNext':
          return state.homeSection.upNext;
        case 'latestmedia':
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return state.homeSection.latestMedia[this.section.libraryId];
        default:
          return [];
      }
    }
  }),
  async created() {
    switch (this.section.type) {
      case 'libraries': {
        await this.getLibraries();
        break;
      }
      case 'resume': {
        await this.getVideoResumes();
        break;
      }
      case 'resumeaudio': {
        await this.getAudioResumes();
        break;
      }
      case 'upnext': {
        await this.getUpNext({
          parentId: this.section.libraryId
        });
        break;
      }
      case 'latestmedia': {
        await this.getLatestMedia({
          parentId: this.section.libraryId
        });
        break;
      }
      default:
        break;
    }

    this.loading = false;
  },
  methods: {
    ...mapActions('homeSection', {
      getVideoResumes: 'getVideoResumes',
      getAudioResumes: 'getAudioResumes',
      getUpNext: 'getUpNext',
      getLatestMedia: 'getLatestMedia',
      getLibraries: 'getLibraries'
    })
  }
});
</script>

<style lang="scss" scoped>
h1 {
  margin-left: 0.4em;
  margin-bottom: 0.25em;
}

.home-section .header span {
  padding-left: 0.25em;
}

@import '~vuetify/src/styles/styles.sass';
.home-section .header::before {
  background-color: #{map-get($material-dark, 'text-color')};
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
.home-section .header-white-mode::before {
  background-color: #{map-get($material-light, 'text-color')};
}
</style>

<style>
.home-section .vueperslides__track {
  position: relative;
  cursor: default !important;
}

@media (hover: none) {
  .home-section .vueperslides__arrows {
    display: none !important;
  }
}
.home-section .vueperslides__arrows {
  display: flex;
  position: absolute;
  top: -2.75em;
  right: 0;
  align-items: center;
}
.home-section .vueperslides__arrow {
  position: relative;
  display: inline-flex;
  transform: none;
}
.home-section .vueperslides__arrow--prev {
  margin-right: 0.75em;
}
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::after,
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::before {
  box-shadow: none;
}
</style>
