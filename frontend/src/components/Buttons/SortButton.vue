<template>
  <v-btn
    icon
    v-bind="props"
    :disabled="disabled"
    @click="emit('change', model[0], !props.ascending)">
    <v-icon v-if="props.ascending">
      <i-mdi-sort-ascending />
    </v-icon>
    <v-icon v-else>
      <i-mdi-sort-descending />
    </v-icon>
  </v-btn>
  <v-btn class="my-2">
    {{ !$vuetify.display.smAndDown ? sortingLabel : undefined }}
    <v-icon :end="!$vuetify.display.smAndDown">
      <i-mdi-menu-down v-if="!$vuetify.display.smAndDown" />
      <i-mdi-sort-alphabetical-variant
        v-else-if="model.length === 0 || model[0] == items[0].value" />
      <i-mdi-numeric-9-plus-box-outline
        v-else-if="model[0] == items[1].value" />
      <i-mdi-calendar-range v-else-if="model[0] == items[2].value" />
    </v-icon>
    <v-menu :disabled="disabled">
      <v-list
        v-model:selected="model"
        :items="items"
        class="filter-content"
        @update:selected="emit('change', model[0], props.ascending)" />
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{ ascending: boolean; disabled?: boolean }>(),
  { disabled: false }
);
const emit = defineEmits<{
  (e: 'change', sortBy: string, ascendingOrder: boolean): void;
}>();

const { t } = useI18n();

const model = ref<string[]>([]);

const items = computed<Array<Record<string, string>>>(() => [
  { title: t('name'), value: 'SortName' },
  { title: t('rating'), value: 'CommunityRating' },
  { title: t('releaseDate'), value: 'PremiereDate' }
]);

const sortingLabel = computed(() =>
  t('sortByType', {
    type:
      model.value.length === 0
        ? items.value[0].title
        : items.value.find((x) => x.value === model.value[0])?.title
  })
);
</script>
