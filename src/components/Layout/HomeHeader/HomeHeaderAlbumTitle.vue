<template functional>
  <div>
    <nuxt-link v-if="props.logo.tag" :to="props.parentLink">
      <v-img
        max-width="50%"
        max-height="5.5em"
        contain
        position="left center"
        data-swiper-parallax="-300"
        :alt="props.item.Name"
        :src="props.logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3"
      :to="props.parentLink"
    >
      {{ props.item.AlbumArtist }}
    </nuxt-link>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h4 text-sm-h3 text-truncate"
      :to="props.link"
    >
      {{ props.item.Name }}
    </nuxt-link>
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
    parentLink: {
      type: String,
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
