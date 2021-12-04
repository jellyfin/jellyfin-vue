<template>
  <div>
    <nuxt-link v-if="logo && logo.tag && link" :to="link">
      <v-img
        class="mb-2"
        :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
        :max-height="$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
        contain
        data-swiper-parallax="-300"
        :alt="item.Name"
        :src="logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else-if="link"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="link"
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
import { VImg } from 'vuetify/lib';
import { BaseItemDto } from '@jellyfin/client-axios';
import { ImageUrlInfo } from '~/mixins/imageHelper';

Vue.component('VImg', VImg);

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    link: {
      type: String,
      required: true
    },
    logo: {
      type: Object as () => ImageUrlInfo,
      default: undefined
    }
  }
});
</script>
