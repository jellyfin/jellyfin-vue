<template>
  <v-card
    v-if="itemId"
    height="100%"
    class="d-flex flex-column refresh-metadata">
    <v-card-title>{{ t('metadata.refresh.title') }}</v-card-title>

    <v-divider />

    <v-select
      v-model="refreshMethod"
      :items="refreshMethods"
      :hint="t('metadata.refresh.methodHint')"
      item-title="title"
      item-value="value"
      single-line
      persistent-hint
      return-object />

    <v-spacer v-if="refreshMethod.value !== 'scan'" />

    <v-checkbox
      v-if="refreshMethod.value !== 'scan'"
      v-model="replace"
      :label="t('metadata.refresh.replaceImage')" />

    <v-divider />

    <v-card-actions
      class="d-flex align-center pa-3"
      :class="{
        'justify-end': !$vuetify.display.mobile,
        'justify-center': $vuetify.display.mobile
      }">
      <v-btn
        variant="flat"
        width="8em"
        color="secondary"
        class="mr-1"
        @click="emit('cancel')">
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getItemRefreshApi } from '@jellyfin/sdk/lib/utils/api/item-refresh-api';
import { MetadataRefreshMode } from '@jellyfin/sdk/lib/generated-client';
import { useRemote, useSnackbar } from '@/composables';

const props = defineProps<{
  itemId: string;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'cancel'): void;
}>();

interface RefreshMethod {
  title: string;
  value: string;
}

const { t } = useI18n();
const remote = useRemote();
const replace = ref(false);
const refreshMethod = ref<RefreshMethod>({
  title: t('metadata.refresh.scan'),
  value: 'scan'
});
const loading = ref(false);

const refreshMethods = computed(() => {
  return [
    {
      title: t('metadata.refresh.scan'),
      value: 'scan'
    },
    {
      title: t('metadata.refresh.missing'),
      value: 'missing'
    },
    {
      title: t('metadata.refresh.all'),
      value: 'all'
    }
  ] as RefreshMethod[];
});

/**
 * Refresh metadata of the current item
 */
async function refreshMetadata(): Promise<void> {
  let refreshMode: MetadataRefreshMode;

  switch (refreshMethod.value.value) {
    case 'scan': {
      refreshMode = 'Default';
      break;
    }
    case 'missing': {
      refreshMode = 'FullRefresh';
      break;
    }
    case 'all': {
      refreshMode = 'FullRefresh';
      break;
    }
    default: {
      refreshMode = 'Default';
      break;
    }
  }

  const replaceMetadata = refreshMethod.value.value === 'all';

  try {
    loading.value = true;

    await remote.sdk.newUserApi(getItemRefreshApi).refreshItem({
      itemId: props.itemId,
      metadataRefreshMode: refreshMode,
      imageRefreshMode: refreshMode,
      replaceAllMetadata: replaceMetadata,
      replaceAllImages: replace.value
    });
    emit('refresh');

    useSnackbar(t('metadata.refresh.success'), 'success');
  } catch (error) {
    console.error(error);

    useSnackbar(t('unableToRefreshLibrary'), 'error');
  } finally {
    loading.value = false;
  }
}
</script>
