<template>
  <div>
    <nuxt-link v-if="getLogo(item).tag" :to="'#'">
      <v-img
        class="mb-2"
        :max-width="display.mdAndUp.value ? '50%' : '40%'"
        :max-height="display.smAndUp.value ? '7.5em' : '4em'"
        contain
        position="left center"
        data-swiper-parallax="-300"
        :alt="item.Name"
        :src="getLogo(item).url"
      />
    </nuxt-link>
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h2 mt-n2 mb-n1 text-truncate"
      :to="'#'"
    >
      {{ item.SeriesName }}
    </nuxt-link>
    <p data-swiper-parallax="-200" class="mb-n1 text-truncate text-subtitle-2">
      {{ item.SeasonName }}
      {{ t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
    </p>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h5 text-sm-h4 text-truncate"
      :to="'#'"
    >
      {{ item.Name }}
    </nuxt-link>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { BaseItemDto } from '@jellyfin/client-axios';
import { useDisplay } from 'vuetify/lib/composables/display';
import { useBaseItem } from '~/composables/items';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  item: {
    type: Object as () => BaseItemDto,
    required: true
  }
});

const { t } = useI18n();

const display = useDisplay();

const { getLogo } = useBaseItem();

/* import { defineComponent } from 'vue';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
// import imageHelper from '~/mixins/imageHelper';
// import itemHelper from '~/mixins/itemHelper';

export default defineComponent({
  //mixins: [imageHelper, itemHelper],
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    logo: {
      type: String,
      default: ''
    }
  }
  /* computed: {
    imageTag(): string | undefined {
      return this.getImageTag(this.item, ImageType.Logo);
    }
  } */
//}); */
</script>
