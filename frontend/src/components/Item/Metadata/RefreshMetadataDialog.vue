<template>
  <v-dialog
    width="auto"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <v-card class="pa-3">
      <v-card-title class="text-center">
        {{ t('refreshMetadata') }}
      </v-card-title>
      <v-divider />
      <!-- TODO: Investigate why style is needed for mobile breakpoint -->
      <v-select
        v-model="selectedMethod"
        :items="refreshMethods"
        :hint="t('refreshMetadataHint')"
        item-title="title"
        item-value="value"
        single-line
        persistent-hint
        return-object
        style="display: unset" />

      <v-spacer v-if="selectedMethod.value !== 'scan'" />
      <v-checkbox
        v-if="selectedMethod.value !== 'scan'"
        v-model="replace"
        :label="t('replaceExistingImages')" />

      <v-card-actions
        class="d-flex align-center"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <v-btn
          variant="flat"
          width="8em"
          color="secondary"
          @click="model = false">
          {{ t('cancel') }}
        </v-btn>
        <v-btn
          variant="flat"
          width="8em"
          color="primary"
          :loading="loading"
          @click="refreshMetadata">
          {{ t('refresh') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  BaseItemDto,
  MetadataRefreshMode
} from '@jellyfin/sdk/lib/generated-client';
import { getItemRefreshApi } from '@jellyfin/sdk/lib/utils/api/item-refresh-api';
import { useRemote, useSnackbar } from '@/composables';
import taskManager, { TaskType } from '@/store/taskManager';

interface RefreshMethod {
  title: string;
  value: 'scan' | 'missing' | 'all';
}

const props = defineProps<{
  item: BaseItemDto;
}>();

const model = ref(true);
const loading = ref(false);
const replace = ref(false);
const emit = defineEmits<{
  (e: 'close'): void;
}>();
const { t } = useI18n();
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
  const remote = useRemote();
  const replaceMetadata = selectedMethod.value.value === 'all';

  if (!props.item.Id) {
    return;
  }

  try {
    loading.value = true;

    await remote.sdk.newUserApi(getItemRefreshApi).refreshItem({
      itemId: props.item.Id,
      metadataRefreshMode: refreshMode.value,
      imageRefreshMode: refreshMode.value,
      replaceAllMetadata: replaceMetadata,
      replaceAllImages: replace.value
    });

    taskManager.startTask({
      type: TaskType.LibraryRefresh,
      id: props.item.Id || '',
      data: props.item.Name || 'ID ' + props.item.Id,
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
