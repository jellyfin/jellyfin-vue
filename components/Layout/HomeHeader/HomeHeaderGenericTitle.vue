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
      class="mb-1"
      :max-width="parent.$vuetify.breakpoint.mdAndUp ? '50%' : '40%'"
      :max-height="parent.$vuetify.breakpoint.smAndUp ? '7.5em' : '4em'"
      contain
      position="left center"
      :src="props.logo"
    />
    <h1 v-else class="text-h4 text-sm-h3 text-sm-h2 text-truncate">
      {{ props.item.Name }}
    </h1>
    <h2
      v-if="props.item.Taglines && props.item.Taglines.length > 0"
      class="text-truncate"
    >
      {{ props.item.Taglines[0] }}
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
