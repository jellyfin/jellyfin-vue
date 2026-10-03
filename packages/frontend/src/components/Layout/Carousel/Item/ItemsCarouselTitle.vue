<template>
  <div>
    <RouterLink
      v-if="logo && logoLink"
      :to="logoLink">
      <JImg
        :alt="$t('logo')"
        class="uno-mb-2"
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
      class="link text-h4 text-sm-h3 text-sm-h2 uno-block uno-truncate"
      :to="itemLink">
      {{ titleString }}
    </RouterLink>
    <p
      v-if="subtitle"
      data-swiper-parallax="-200"
      class="text-h6 uno-truncate">
      {{ subtitle }}
    </p>
    <h2
      v-if="item.Taglines && item.Taglines.length"
      data-swiper-parallax="-200"
      class="uno-truncate">
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getLogo } from '#/utils/images.ts';
import { getItemDetailsLink } from '#/utils/items.ts';

const { item } = defineProps<{ item: BaseItemDto }>();

const logo = computed(() => getLogo(item));
const itemLink = computed(() => getItemDetailsLink(item));
const titleString = computed(() => {
  if (item.Type === BaseItemKind.MusicAlbum && item.AlbumArtist) {
    return item.AlbumArtist;
  }

  return item.Type === BaseItemKind.Episode
    && item.SeriesName
    ? item.SeriesName
    : item.Name;
});

const logoLink = computed(() => {
  if (
    item.Type === BaseItemKind.MusicAlbum
    && item.AlbumArtists?.length
  ) {
    return getItemDetailsLink(
      item.AlbumArtists[0],
      BaseItemKind.MusicArtist
    );
  }

  if (item.Type === BaseItemKind.Episode && item.SeriesId) {
    return getItemDetailsLink({ Id: item.SeriesId }, BaseItemKind.Series);
  }
});

const subtitle = computed(() => {
  if (
    item.Type === BaseItemKind.MusicAlbum
    || item.Type === BaseItemKind.Episode
  ) {
    return item.Name;
  }
});
</script>
