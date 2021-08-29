<template functional>
  <div>
    <nuxt-link v-if="props.logo.tag" :to="props.parentLink">
      <v-img
        class="mb-2"
        :max-width="parent.$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
        :max-height="parent.$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
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
      class="link d-block text-h4 text-sm-h2 text-truncate mt-n2 mb-n1"
      :to="props.parentLink"
    >
      {{ props.item.SeriesName }}
    </nuxt-link>
    <p data-swiper-parallax="-200" class="mb-n1 text-truncate text-subtitle-2">
      {{ props.item.SeasonName }}
      {{
        parent.$t('episodeNumber', { episodeNumber: props.item.IndexNumber })
      }}
    </p>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h5 text-sm-h4 text-truncate"
      :to="props.link"
    >
      {{ props.item.Name }}
    </nuxt-link>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { VImg } from 'vuetify/lib';
import { BaseItemDto } from '@jellyfin/client-axios';
import { ImageUrlInfo } from '~/mixins/imageHelper';

Vue.component('VImg', VImg);

export default Vue.extend({
  props: {
    item: {
      type: Object as PropType<BaseItemDto>,
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
      type: Object as PropType<ImageUrlInfo>,
      default: undefined
    }
  }
});
</script>
