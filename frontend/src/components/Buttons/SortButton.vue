<template>
  <v-btn icon v-bind="props" @click="changeOrder">
    <v-icon v-if="ascendingOrder">
      <i-mdi-sort-ascending />
    </v-icon>
    <v-icon v-else>
      <i-mdi-sort-descending />
    </v-icon>
  </v-btn>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        v-if="!$vuetify.display.smAndDown"
        class="my-2"
        v-bind="mergeProps(menuProps, props)">
        {{
          $t('sortByType', {
            type:
              model.length === 0
                ? items[0].title
                : items.find((x) => x.value === model[0])?.title
          })
        }}
        <v-icon end>
          <i-mdi-menu-down />
        </v-icon>
      </v-btn>
      <v-btn v-else class="my-2" icon v-bind="mergeProps(menuProps, props)">
        <v-icon v-if="model.length === 0 || model[0] == items[0].value">
          <i-mdi-sort-alphabetical-variant />
        </v-icon>
        <v-icon v-else-if="model[0] == items[1].value">
          <i-mdi-numeric-9-plus-box-outline />
        </v-icon>
        <v-icon v-else-if="model[0] == items[2].value">
          <i-mdi-calendar-range />
        </v-icon>
      </v-btn>
    </template>
    <v-list
      v-model:selected="model"
      :items="items"
      class="filter-content"
      @update:selected="emit('change', model[0], ascendingOrder)" />
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, mergeProps } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false
});
const emit = defineEmits<{
  (e: 'change', types: Record<string, string>, ascendingOrder: boolean): void;
}>();
const model = ref([]);
const ascendingOrder = ref(true);

const items = computed<Array<Record<string, string>>>(() => [
  { title: t('name'), value: 'SortName' },
  { title: t('rating'), value: 'CommunityRating' },
  { title: t('releaseDate'), value: 'PremiereDate' }
]);

/**
 * Change the sort order
 * ascending <-> descending
 */
function changeOrder(): void {
  ascendingOrder.value = !ascendingOrder.value;

  emit(
    'change',
    model.value.length === 0 ? items.value[0] : model.value[0],
    ascendingOrder.value
  );
}
</script>
