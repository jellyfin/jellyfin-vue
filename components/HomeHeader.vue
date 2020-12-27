<template>
  <transition name="fade" mode="in-out" @after-leave="onTransitionEnd">
    <div v-if="loading" ref="headerWelcome" key="headerWelcome">
      <home-header-welcome :extra-text="extraText" />
    </div>
    <home-header-items
      v-else-if="show"
      key="headerSwiper"
      :items="items"
      :related-items="relatedItems"
    />
  </transition>
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
      items: [] as BaseItemDto[],
      relatedItems: {} as { [k: number]: BaseItemDto },
      loading: true,
      show: false,
      extraText: ''
    };
  },
  async beforeMount() {
    this.items = (
      await this.$api.userLibrary.getLatestMedia({
        userId: this.$auth.user.Id,
        limit: this.pages,
        fields: [ItemFields.Overview],
        enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
        imageTypeLimit: 1
      })
    ).data;

    // TODO: Server should include a ParentImageBlurhashes property, so we don't need to do a call
    // for the parent items. Revisit this once proper changes are done.

    for (const [key, i] of this.items.entries()) {
      let id: string;
      if (i.Type === 'Episode' && i.SeriesId) {
        id = i?.SeriesId as string;
      } else if (i.Type === 'MusicAlbum') {
        id = i?.AlbumArtists?.[0].Id as string;
      } else if (i.ParentLogoItemId) {
        id = i?.ParentLogoItemId as string;
      } else {
        continue;
      }

      const itemData = (
        await this.$api.userLibrary.getItem({
          userId: this.$auth.user.Id,
          itemId: id
        })
      ).data;

      this.relatedItems[key] = itemData;
    }
    // this.items = [];

    if (this.items.length === 0) {
      this.extraText = 'There are no new items to show';
    } else {
      this.extraText = "Check out what's new";
    }
    window.setTimeout(this.hideWelcomeMessage, 1500);
  },
  methods: {
    hideWelcomeMessage(): void {
      if (this.items.length === 0) {
        const elem = this.$refs.headerWelcome as HTMLElement;
        // As the height of the element varies as we're using automatic values, we set first
        // the screen height of the element, so the animation plays correctly when the height is set to 0
        elem.style.maxHeight = elem.scrollHeight + 'px';
        elem.classList.add('no-items');
        elem.addEventListener('animationend', this.onNoItemsTransitionEnd);
      } else {
        this.loading = false;
      }
    },
    onNoItemsTransitionEnd(): void {
      (this.$refs.headerWelcome as Element).remove();
      this.$destroy();
    },
    onTransitionEnd(): void {
      this.show = !this.loading;
    }
  }
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.no-items {
  overflow: hidden;
  animation-name: slideUp;
  animation-duration: 0.75s;
}

@keyframes slideUp {
  to {
    max-height: 0;
    opacity: 0;
  }
}
</style>
