<template>
  <v-btn :icon="$vuetify.display.smAndDown" class="my-2">
    {{
      $vuetify.display.smAndDown
        ? undefined
        : model.length === 0
        ? items[0].title
        : items.find((i) => i.value == model[0])?.title
    }}
    <v-icon :end="!$vuetify.display.smAndDown">
      <i-mdi-menu-down v-if="!$vuetify.display.smAndDown" />
      <i-mdi-eye v-else />
    </v-icon>
    <v-menu :disabled="disabled">
      <v-list
        v-model:selected="model"
        :items="items"
        @update:selected="emit('change', model[0])" />
    </v-menu>
  </v-btn>
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
  (e: 'change', types: BaseItemKind | undefined): void;
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
