<template>
  <swiper-section
    :title="
      section.libraryName === undefined
        ? $t(section.name)
        : $t(section.name, { libraryName: section.libraryName })
    "
    :items="items"
    :shape="section.shape"
    :loading="loading"
  />
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { HomeSection, homeSectionStore } from '~/store';

export default defineComponent({
  props: {
    section: {
      type: Object as () => HomeSection,
      required: true
    }
  },
  data() {
    return {
      loading: true
    };
  },
  computed: {
    ...mapStores(homeSectionStore),
    items(): BaseItemDto[] {
      return this.homeSection.getHomeSectionContent(this.section);
    }
  },
  async beforeMount() {
    if (this.homeSection.getHomeSectionContent(this.section)) {
      this.loading = false;
    }

    switch (this.section.type) {
      case 'libraries': {
        break;
      }
      case 'resume': {
        await this.homeSection.getVideoResumes();
        break;
      }
      case 'resumeaudio': {
        await this.homeSection.getAudioResumes();
        break;
      }
      case 'upnext': {
        await this.homeSection.getUpNext(this.section.libraryId);
        break;
      }
      case 'latestmedia': {
        await this.homeSection.getLatestMedia(this.section.libraryId);
        break;
      }
      default:
        break;
    }

    this.loading = false;
  }
});
</script>
