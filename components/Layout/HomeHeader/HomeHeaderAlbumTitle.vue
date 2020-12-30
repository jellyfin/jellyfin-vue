<template functional>
  <div :class="[data.class, data.staticClass]">
    <p class="text-overline text-truncate mb-2 my-2">
      {{ parent.$t('homeHeader.items.recentlyAdded') }}
    </p>
    <v-img
      v-if="
        props.item.ParentLogoImageTag ||
        (props.item.ImageTags && props.item.ImageTags.Logo)
      "
      max-width="50%"
      max-height="5.5em"
      contain
      position="left center"
      :src="props.logo"
    />
    <h1 v-else class="text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3">
      {{ props.item.AlbumArtist }}
    </h1>
    <h2 class="text-h4 text-sm-h3 text-truncate">
      {{ props.item.Name }}
    </h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    logo: {
      type: String,
      required: true
    }
  }
});
</script>
