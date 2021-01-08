<template>
  <transition name="fade" mode="in-out" @after-leave="onTransitionEnd">
    <div
      v-if="loading"
      ref="headerWelcome"
      key="headerWelcome"
      @animationend="onNoItemsTransitionEnd"
    >
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
        userId: this.$auth.user?.Id,
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
      if (i.Type === 'Episode' && i?.SeriesId) {
        id = i.SeriesId;
      } else if (i.Type === 'MusicAlbum' && i?.AlbumArtists?.[0]?.Id) {
        id = i.AlbumArtists[0]?.Id;
      } else if (i?.ParentLogoItemId) {
        id = i.ParentLogoItemId;
      } else {
        continue;
      }

      const itemData = (
        await this.$api.userLibrary.getItem({
          userId: this.$auth.user?.Id,
          itemId: id
        })
      ).data;

      this.relatedItems[key] = itemData;
    }

    if (this.items.length === 0) {
      this.extraText = this.$t('homeHeader.welcome.noItems');
    } else {
      this.extraText = this.$t('homeHeader.welcome.checkNewItems');
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
      } else {
        this.loading = false;
      }
    },
    onNoItemsTransitionEnd(): void {
      this.loading = false;
    },
    onTransitionEnd(): void {
      if (this.items.length !== 0) {
        this.show = !this.loading;
      }
    }
  }
});
</script>

<style lang="scss">
@import '~/assets/transitions.scss';
</style>

<style lang="scss" scoped>
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
