<template>
  <div>
    <!-- <nuxt-link
      v-if="imageTag"
      :to="
        item.AlbumArtists.length > 0
          ? getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')
          : null
      "
    > -->
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
    <!-- </nuxt-link>
    <nuxt-link
      v-else
      data-swiper-parallax="-300"
      class="link d-block text-h5 text-sm-h4 text-truncate mb-n1 mb-sm-n2 mt-n3"
      :to="
        item.AlbumArtists.length > 0
          ? getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')
          : null
      "
    > -->
    {{ item.AlbumArtist }}
    <!-- </nuxt-link>
    <nuxt-link
      data-swiper-parallax="-200"
      class="link d-block text-h4 text-sm-h3 text-truncate"
      :to="getItemDetailsLink(item)"
    > -->
    {{ item.Name }}
    <!-- </nuxt-link> -->
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { BaseItemDto } from '@jellyfin/client-axios';
import { useDisplay } from 'vuetify/lib/composables/display';
import { useBaseItem } from '~/composables/items';

const props = defineProps({
  item: {
    type: Object as () => BaseItemDto,
    required: true
  }
});

const display = useDisplay();

const { getLogo } = useBaseItem();

//import { defineComponent } from 'vue';
//import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
//import imageHelper from '~/mixins/imageHelper';
//import itemHelper from '~/mixins/itemHelper';

/* export default defineComponent({
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
  /*computed: {
    imageTag(): string | undefined {
      return this.getImageTag(this.item, ImageType.Logo);
    }
  }*/
//}); */
</script>
