<template>
  <div>
    <router-link v-if="logo && logoLink" :to="logoLink">
      <v-img
        class="mb-2"
        data-swiper-parallax="-300"
        :style="{
          'max-width': $vuetify.display.mdAndUp ? '50%' : '40%',
          'max-height': $vuetify.display.smAndUp ? '7.5em' : '4em'
        }"
        :src="logo.url" />
    </router-link>
    <router-link
      v-else-if="itemLink && titleString"
      data-swiper-parallax="-300"
      class="link d-block text-h4 text-sm-h3 text-sm-h2 text-truncate"
      :to="itemLink">
      {{ titleString }}
    </router-link>
    <p
      v-if="subtitle"
      data-swiper-parallax="-200"
      class="text-truncate text-subtitle-2">
      {{ subtitle }}
    </p>
    <h2
      v-if="item.Taglines && item.Taglines.length > 0"
      data-swiper-parallax="-200"
      class="text-truncate">
      {{ item.Taglines[0] }}
    </h2>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { getLogo } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';

const props = defineProps<{ item: BaseItemDto }>();
const { t } = useI18n();

const logo = computed(() => getLogo(props.item));
const itemLink = computed(() => getItemDetailsLink(props.item));
const titleString = computed(() => {
  if (props.item.Type === BaseItemKind.MusicAlbum && props.item.AlbumArtist) {
    return props.item.AlbumArtist;
  } else if (
    props.item.Type === BaseItemKind.Episode &&
    props.item.SeriesName
  ) {
    return props.item.SeriesName;
  } else {
    return props.item.Name;
  }
});

const logoLink = computed(() => {
  if (
    props.item.Type === BaseItemKind.MusicAlbum &&
    props.item.AlbumArtists?.length
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
  if (props.item.Type === BaseItemKind.MusicAlbum) {
    return props.item.Name;
  } else if (
    props.item.Type === BaseItemKind.Episode &&
    props.item.SeasonName &&
    props.item.IndexNumber &&
    props.item.Name
  ) {
    const episodeString = t('episodeNumber', {
      episodeNumber: props.item.IndexNumber
    });

    return `${props.item.SeasonName} - ${episodeString}\n${props.item.Name}`;
  }
});
</script>
