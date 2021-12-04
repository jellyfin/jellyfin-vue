<template>
  <div>
    <nuxt-link v-if="logo.tag && parentLink" :to="parentLink">
      <v-img
        class="mb-2"
        :max-width="$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
        :max-height="$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
        contain
        position="left center"
        data-swiper-parallax="-300"
        :alt="item.Name"
        :src="logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else-if="parentLink"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h2 text-truncate mt-n2 mb-n1"
      :to="parentLink"
    >
      {{ item.SeriesName }}
    </nuxt-link>
    <p data-swiper-parallax="-200" class="mb-n1 text-truncate text-subtitle-2">
      {{ item.SeasonName }}
      {{ $t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
    </p>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h5 text-sm-h4 text-truncate"
      :to="link"
    >
      {{ item.Name }}
    </nuxt-link>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { ImageUrlInfo } from '~/mixins/imageHelper';

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
