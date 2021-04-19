<template>
  <home-header-items :items="items" />
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    pages: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      items: [] as BaseItemDto[]
    };
  },
  async beforeMount() {
    this.items = (
      await this.$api.userLibrary.getLatestMedia({
        userId: this.$auth.user?.Id,
        limit: this.pages,
        fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio],
        enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
        imageTypeLimit: 1
      })
    ).data;
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/styles/HomeHeader.scss';
.progress-bar-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 10px 0;
  height: 10px;
}

.no-items {
  overflow: hidden;
  animation-name: slideUp;
  animation-duration: 0.75s;
  animation-fill-mode: forwards;
  animation-iteration-count: 1;
}

@keyframes slideUp {
  to {
    max-height: 0;
    opacity: 0;
  }
}
</style>
