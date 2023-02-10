<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        v-if="!$vuetify.display.smAndDown && (model.length === 0 || model[0])"
        class="my-2"
        v-bind="mergeProps(props, menuProps)">
        {{
          model.length === 0
            ? items[0].title
            : items.find((x) => x.value == model[0])?.title
        }}
        <v-icon end>
          <i-mdi-menu-down />
        </v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="mergeProps(props, menuProps)">
        <v-icon>
          <i-mdi-eye />
        </v-icon>
      </v-btn>
    </template>
    <v-list
      v-model:selected="model"
      :items="items"
      @update:selected="emit('change', model[0])" />
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, mergeProps } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    type: string;
    disabled?: boolean;
  }>(),
  { disabled: false }
);
const emit = defineEmits<{
  (e: 'change', types: Record<string, string>): void;
}>();
const model = ref([]);

const items = computed(() => {
  switch (props.type) {
    case 'movies': {
      return [
        { title: t('movies'), value: 'Movie' },
        { title: t('collections'), value: 'BoxSet' },
        { title: t('actors'), value: 'Actor' },
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
        { title: t('actors'), value: 'Actor' },
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
