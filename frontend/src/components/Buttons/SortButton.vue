<template>
  <VBtn
    icon
    :disabled="disabled"
    @click="emit('change', model[0], !ascending)">
    <JIcon
      v-if="ascending"
      :class="ascending ? 'i-mdi:sort-ascending' : 'i-mdi:sort-descending'" />
  </VBtn>
  <VBtn class="my-2">
    {{ !$vuetify.display.smAndDown ? sortingLabel : undefined }}
    <JIcon
      v-if="!$vuetify.display.smAndDown"
      class="i-mdi:menu-down" />
    <JIcon
      v-else-if="model.length === 0 || model[0] === items[0].value"
      class="i-mdi:sort-alphabetical-variant" />
    <JIcon
      v-else-if="model[0] === items[1].value"
      class="i-mdi:numeric-9-plus-box-outline" />
    <JIcon
      v-else-if="model[0] === items[2].value"
      class="i-mdi:calendar-range" />
    <VMenu :disabled="disabled">
      <VList
        v-model:selected="model"
        :items="items"
        class="filter-content"
        @update:selected="emit('change', model[0], ascending)" />
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';

const { ascending, disabled } = defineProps<{ ascending: boolean; disabled?: boolean }>();
const emit = defineEmits<{
  change: [sortBy: string, ascendingOrder: boolean];
}>();

const { t } = useTranslation();

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
