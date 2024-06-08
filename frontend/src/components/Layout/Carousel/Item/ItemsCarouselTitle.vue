<template>
  <div>
    <RouterLink
      v-if="logo && logoLink"
      :to="logoLink">
      <JImg
        class="mb-2"
        data-swiper-parallax="-300"
        :style="{
          'max-width': $vuetify.display.mdAndUp ? '50%' : '40%',
          'max-height': $vuetify.display.smAndUp ? '7.5em' : '4em'
        }"
        :src="logo.url" />
    </RouterLink>
    <RouterLink
      v-else-if="itemLink && titleString"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="itemLink">
      {{ titleString }}
    </RouterLink>
    <p
      v-if="subtitle"
      data-swiper-parallax="-200"
      class="text-truncate text-h6">
      {{ subtitle }}
    </p>
    <h2
      v-if="item.Taglines && item.Taglines.length"
      data-swiper-parallax="-200"
      class="text-truncate">
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getLogo } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';

const props = defineProps<{ item: BaseItemDto }>();

const logo = computed(() => getLogo(props.item));
const itemLink = computed(() => getItemDetailsLink(props.item));
const titleString = computed(() => {
  if (props.item.Type === BaseItemKind.MusicAlbum && props.item.AlbumArtist) {
    return props.item.AlbumArtist;
  } else if (
    props.item.Type === BaseItemKind.Episode
    && props.item.SeriesName
  ) {
    return props.item.SeriesName;
  } else {
    return props.item.Name;
  }
});

const logoLink = computed(() => {
  if (
    props.item.Type === BaseItemKind.MusicAlbum
    && props.item.AlbumArtists?.length
  ) {
    return getItemDetailsLink(
      props.item.AlbumArtists[0],
      BaseItemKind.MusicArtist
    );
  } else if (props.item.Type === BaseItemKind.Episode && props.item.SeriesId) {
    return getItemDetailsLink({ Id: props.item.SeriesId }, BaseItemKind.Series);
  }
});

const subtitle = computed(() => {
  if (
    props.item.Type === BaseItemKind.MusicAlbum
    || props.item.Type === BaseItemKind.Episode
  ) {
    return props.item.Name;
  }
});
</script>
