<template>
  <div>
    <v-img
      v-if="imageTag"
      class="mb-2"
      :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
      :max-height="$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
      contain
      position="left center"
      data-swiper-parallax="-300"
      :alt="item.Name"
      :src="logo"
    />
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="getItemDetailsLink(item)"
    >
      {{ item.Name }}
    </nuxt-link>
    <h2
      v-if="item.Taglines && item.Taglines.length > 0"
      data-swiper-parallax="-200"
      class="text-truncate"
    >
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [imageHelper, itemHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    logo: {
      type: String,
      default: ''
    }
  },
  computed: {
    imageTag(): string | undefined {
      return this.getImageTag(this.item, ImageType.Logo);
    }
  }
});
</script>
