<template>
  <VDialog
    width="auto"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <VCard class="pa-3">
      <VCardTitle class="text-center">
        {{ t('refreshMetadata') }}
      </VCardTitle>
      <VDivider />
      <!-- TODO: Investigate why style is needed for mobile breakpoint -->
      <VSelect
        v-model="selectedMethod"
        :items="refreshMethods"
        :hint="t('refreshMetadataHint')"
        item-title="title"
        item-value="value"
        single-line
        return-object
        persistent-hint
        style="display: unset" />
      <VSpacer v-if="selectedMethod.value !== 'scan'" />
      <VCheckbox
        v-if="selectedMethod.value !== 'scan'"
        v-model="replace"
        :label="t('replaceExistingImages')" />
      <VCardActions
        class="d-flex align-center"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <VBtn
          variant="flat"
          width="8em"
          color="secondary"
          @click="model = false">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          variant="flat"
          width="8em"
          color="primary"
          :loading="loading"
          @click="refreshMetadata">
          {{ t('refresh') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import type {
  BaseItemDto,
  MetadataRefreshMode
} from '@jellyfin/sdk/lib/generated-client';
import { getItemRefreshApi } from '@jellyfin/sdk/lib/utils/api/item-refresh-api';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { TaskType, taskManager } from '#/store/task-manager';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';

interface RefreshMethod {
  title: string;
  value: 'scan' | 'missing' | 'all';
}

const { item } = defineProps<{
  item: BaseItemDto;
}>();

const emit = defineEmits<{
  close: [];
}>();
const model = ref(true);
const loading = ref(false);
const replace = ref(false);
const { t } = useTranslation();
const selectedMethod = ref<RefreshMethod>({
  title: t('scanForNewAndUpdatedFiles'),
  value: 'scan'
});
const refreshMethods = computed<RefreshMethod[]>(() => [
  {
    title: t('scanForNewAndUpdatedFiles'),
    value: 'scan'
  },
  {
    title: t('searchMissingMetadata'),
    value: 'missing'
  },
  {
    title: t('replaceAllMetadata'),
    value: 'all'
  }
]);
const refreshMode = computed<MetadataRefreshMode>(() => {
  switch (selectedMethod.value.value) {
    case 'scan': {
      return 'Default';
    }
    case 'missing': {
      return 'FullRefresh';
    }
    case 'all': {
      return 'FullRefresh';
    }
    default: {
      return 'Default';
    }
  }
});

/**
 * Refresh metadata of the current item
 */
async function refreshMetadata(): Promise<void> {
  const replaceMetadata = selectedMethod.value.value === 'all';

  if (!item.Id) {
    return;
  }

  try {
    loading.value = true;

    await remote.sdk.newUserApi(getItemRefreshApi).refreshItem({
      itemId: item.Id,
      metadataRefreshMode: refreshMode.value,
      imageRefreshMode: refreshMode.value,
      replaceAllMetadata: replaceMetadata,
      replaceAllImages: replace.value
    });

    taskManager.startTask({
      type: TaskType.LibraryRefresh,
      id: item.Id || '',
      data: item.Name ?? `ID ${item.Id}`,
      progress: 0
    });

    useSnackbar(t('metadataRefreshQueued'), 'success');
    model.value = false;
  } catch (error) {
    console.error(error);

    useSnackbar(t('anErrorHappened'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
