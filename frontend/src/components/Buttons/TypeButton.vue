<template>
  <VBtn
    :icon="$vuetify.display.smAndDown"
    class="my-2">
    {{
      $vuetify.display.smAndDown || items.length === 0
        ? undefined
        : innerModel.length === 0
          ? items[0].title
          : items.find((i) => i.value === innerModel[0])?.title
    }}
    <JIcon
      :class="{
        'i-mdi:menu-down': !$vuetify.display.smAndDown,
        'i-mdi:eye': $vuetify.display.smAndDown
      }" />
    <VMenu>
      <VList
        :items="items"
        @update:selected="model = innerModel[0]" />
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import type { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { type } = defineProps<{
  type: BaseItemDto['CollectionType'];
}>();

const innerModel = ref<BaseItemKind[]>([]);
const model = defineModel<BaseItemKind | undefined>({ required: true });

const { t } = useI18n();

const items = computed<{ title: string; value: BaseItemKind }[]>(() => {
  switch (type) {
    case 'movies': {
      return [
        { title: t('movies'), value: 'Movie' },
        { title: t('collections'), value: 'BoxSet' },
        { title: t('actors'), value: 'Person' },
        { title: t('genres'), value: 'Genre' },
        { title: t('studios'), value: 'Studio' }
      ];
    }
    case 'music': {
      return [
        { title: t('albums'), value: 'MusicAlbum' },
        { title: t('artists'), value: 'MusicArtist' },
        { title: t('genres'), value: 'MusicGenre' }
      ];
    }
    case 'tvshows': {
      return [
        { title: t('series'), value: 'Series' },
        { title: t('actors'), value: 'Person' },
        { title: t('genres'), value: 'Genre' },
        { title: t('networks'), value: 'Studio' }
      ];
    }
    default: {
      return [];
    }
  }
});
</script>
