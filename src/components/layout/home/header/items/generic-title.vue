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
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="'#'"
    >
      {{ item.Name }}
    </router-link>
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
import type { BaseItemDto } from '@jellyfin/client-axios';
import { defineComponent } from 'vue';
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
    const display = useDisplay();
    const { getLogo } = useBaseItem();

    return { display, getLogo };
  }
});
</script>
