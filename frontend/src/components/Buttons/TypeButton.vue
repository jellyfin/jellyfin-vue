<template>
  <VBtn
    :icon="$vuetify.display.smAndDown"
    class="my-2">
    {{
      $vuetify.display.smAndDown || items.length === 0
        ? undefined
        : model.length === 0
          ? items[0].title
          : items.find((i) => i.value == model[0])?.title
    }}
    <VIcon :end="!$vuetify.display.smAndDown">
      <IMdiMenuDown v-if="!$vuetify.display.smAndDown" />
      <IMdiEye v-else />
    </VIcon>
    <VMenu :disabled="disabled">
      <VList
        v-model:selected="model"
        :items="items"
        @update:selected="emit('change', model[0])" />
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    /** CollectionType */
    type: string | undefined;
    disabled?: boolean;
  }>(),
  { disabled: false }
);
const emit = defineEmits<{
  change: [types: BaseItemKind | undefined];
}>();

const { t } = useI18n();

const model = ref<BaseItemKind[]>([]);

const items = computed<{ title: string; value: BaseItemKind }[]>(() => {
  switch (props.type) {
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
