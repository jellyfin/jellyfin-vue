<template>
  <v-btn
    v-if="canMarkWatched(item)"
    :color="isPlayed ? 'primary' : ''"
    :icon="IMdiCheck"
    size="small"
    @click.stop.prevent="togglePlayed" />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import IMdiCheck from 'virtual:icons/mdi/check';
import { canMarkWatched } from '@/utils/items';
import { useRemote, useSnackbar } from '@/composables';

const props = defineProps<{
  item: BaseItemDto;
}>();

const isPlayed = ref(props.item.UserData?.Played || false);

const remote = useRemote();
const { t } = useI18n();

/**
 * Toggles the played state of the given item
 */
async function togglePlayed(): Promise<void> {
  try {
    if (!props.item.Id) {
      throw new Error('Item has no Id');
    }

    if (isPlayed.value) {
      isPlayed.value = false;
      await remote.sdk.newUserApi(getPlaystateApi).markUnplayedItem({
        userId: remote.auth.currentUserId.value || '',
        itemId: props.item.Id
      });
    } else {
      isPlayed.value = true;
      await remote.sdk.newUserApi(getPlaystateApi).markPlayedItem({
        userId: remote.auth.currentUserId.value || '',
        itemId: props.item.Id
      });
    }
  } catch {
    useSnackbar(t('unableToTogglePlayed'), 'error');
    isPlayed.value = !isPlayed.value;
  }
}
</script>
