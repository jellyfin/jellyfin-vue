<template>
  <swiper-section
    :title="section.name"
    :items="items"
    :shape="section.shape"
    :loading="loading"
  />
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';
import { HomeSection } from '~/store/homeSection';

export default Vue.extend({
  props: {
    section: {
      type: Object as () => HomeSection,
      required: true
    },
    index: {
      type: [Number, Boolean],
      default() {
        return false;
      }
    }
  },
  data() {
    return {
      loading: true
    };
  },
  computed: {
    ...mapGetters('homeSection', ['getHomeSectionContent']),
    items(): BaseItemDto[] {
      return this.getHomeSectionContent(this.section);
    }
  },
  async beforeMount() {
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

    this.$data.loading = false;
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
