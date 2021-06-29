<template>
  <div>
    <router-link v-if="getLogo(item).tag" :to="'#'">
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
    </router-link>
    <router-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h2 mt-n2 mb-n1 text-truncate"
      :to="'#'"
    >
      {{ item.SeriesName }}
    </router-link>
    <p data-swiper-parallax="-200" class="mb-n1 text-truncate text-subtitle-2">
      {{ item.SeasonName }}
      {{ t('episodeNumber', { episodeNumber: item.IndexNumber }) }}
    </p>
    <router-link
      data-swiper-parallax="-200"
      class="link d-block text-h5 text-sm-h4 text-truncate"
      :to="'#'"
    >
      {{ item.Name }}
    </router-link>
  </div>
</template>

<script lang="ts">
import type { BaseItemDto } from '@jellyfin/client-axios';
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/lib/composables/display';

import { useBaseItem } from '~/composables/items';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const { getLogo } = useBaseItem();

    return { t, display, getLogo };
  }
});
</script>
