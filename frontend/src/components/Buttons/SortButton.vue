<template>
  <VBtn
    icon
    v-bind="props"
    :disabled="disabled"
    @click="emit('change', model[0], !props.ascending)">
    <VIcon v-if="props.ascending">
      <IMdiSortAscending />
    </VIcon>
    <VIcon v-else>
      <IMdiSortDescending />
    </VIcon>
  </VBtn>
  <VBtn class="my-2">
    {{ !$vuetify.display.smAndDown ? sortingLabel : undefined }}
    <VIcon :end="!$vuetify.display.smAndDown">
      <IMdiMenuDown v-if="!$vuetify.display.smAndDown" />
      <IMdiSortAlphabeticalVariant
        v-else-if="model.length === 0 || model[0] == items[0].value" />
      <IMdiNumeric9PlusBoxOutline
        v-else-if="model[0] == items[1].value" />
      <IMdiCalendarRange v-else-if="model[0] == items[2].value" />
    </VIcon>
    <VMenu :disabled="disabled">
      <VList
        v-model:selected="model"
        :items="items"
        class="filter-content"
        @update:selected="emit('change', model[0], props.ascending)" />
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{ ascending: boolean; disabled?: boolean }>(),
  { disabled: false }
);
const emit = defineEmits<{
  change: [sortBy: string, ascendingOrder: boolean];
}>();

const { t } = useI18n();

const model = ref<string[]>([]);

const items = computed<Record<string, string>[]>(() => [
  { title: t('name'), value: 'SortName' },
  { title: t('rating'), value: 'CommunityRating' },
  { title: t('releaseDate'), value: 'PremiereDate' },
  { title: t('dateAdded'), value: 'DateCreated' },
  { title: t('datePlayed'), value: 'DatePlayed' },
  { title: t('parentalRating'), value: 'OfficialRating' },
  { title: t('playCount'), value: 'PlayCount' },
  { title: t('runtime'), value: 'Runtime' }
]);

const sortingLabel = computed(() =>
  t('sortByType', {
    type:
      model.value.length === 0
        ? items.value[0].title
        : items.value.find(x => x.value === model.value[0])?.title
  })
);
</script>
