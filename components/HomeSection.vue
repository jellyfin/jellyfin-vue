<template>
  <v-col v-show="items.length > 0" class="home-section">
    <h1 class="text-h5 font-weight-light header">
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
        <template v-slot:content>
          <card :shape="section.shape" :item="item" />
        </template>
      </vueper-slide>

      <template v-slot:arrow-left>
        <v-btn icon large>
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </template>

      <template v-slot:arrow-right>
        <v-btn icon large>
          <v-icon>mdi-arrow-right</v-icon>
        </v-btn>
      </template>
    </vueper-slides>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '../api';

export default Vue.extend({
  props: {
    section: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      items: [] as BaseItemDto[],
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
      }
    };
  },
  async created() {
    switch (this.section.type) {
      case 'resume': {
        const resumeItems = await this.$api.items.getResumeItems({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          enableTotalRecordCount: false,
          mediaTypes: 'Video'
        });

        this.items = resumeItems.data.Items as BaseItemDto[];
        break;
      }
      case 'resumeaudio': {
        const resumeItems = await this.$api.items.getResumeItems({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          enableTotalRecordCount: false,
          mediaTypes: 'Audio'
        });

        this.items = resumeItems.data.Items as BaseItemDto[];
        break;
      }
      case 'upnext': {
        const latestItems = await this.$api.tvShows.getNextUp({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          parentId: this.section.libraryId
        });

        this.items = latestItems.data.Items as BaseItemDto[];
        break;
      }
      case 'latestmedia': {
        const latestItems = await this.$api.userLibrary.getLatestMedia({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          parentId: this.section.libraryId
        });

        this.items = latestItems.data;
        break;
      }
      default:
        break;
    }
  }
});
</script>

<style scoped>
h1 {
  margin-left: 0.4em;
  margin-bottom: 0.25em;
}

.home-section .header span {
  padding-left: 0.25em;
}
.home-section .header::before {
  background-color: white;
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
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
