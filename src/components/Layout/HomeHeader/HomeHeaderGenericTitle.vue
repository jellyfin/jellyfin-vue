<template functional>
  <div>
    <nuxt-link v-if="props.logo && props.logo.tag" :to="props.link">
      <v-img
        class="mb-2"
        :max-width="parent.$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
        :max-height="parent.$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
        contain
        data-swiper-parallax="-300"
        :alt="props.item.Name"
        :src="props.logo.url"
      />
    </nuxt-link>
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="props.link"
    >
      {{ props.item.Name }}
    </nuxt-link>
    <h2
      v-if="props.item.Taglines && props.item.Taglines.length > 0"
      data-swiper-parallax="-200"
      class="text-truncate"
    >
      {{ props.item.Taglines[0] }}
    </h2>
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
