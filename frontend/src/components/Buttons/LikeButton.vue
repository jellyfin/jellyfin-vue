<template>
  <v-btn
    :icon="isFavorite ? IMdiHeart : IMdiHeartOutline"
    size="small"
    @click.stop.prevent="toggleFavorite" />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import IMdiHeart from 'virtual:icons/mdi/heart';
import IMdiHeartOutline from 'virtual:icons/mdi/heart-outline';
import { useI18n } from 'vue-i18n';
import { useRemote, useSnackbar } from '@/composables';

const props = defineProps<{ item: BaseItemDto }>();

const isFavorite = ref(false);
const remote = useRemote();
const { t } = useI18n();

watch(
  () => props.item.UserData?.IsFavorite,
  () => {
    isFavorite.value = props.item.UserData?.IsFavorite || false;
  },
  { immediate: true }
);

/**
 * Toggles the favorite on the server
 */
async function toggleFavorite(): Promise<void> {
  try {
    if (!props.item.Id) {
      throw new Error('Item has no Id');
    }

    if (!isFavorite.value) {
      isFavorite.value = true;

      await remote.sdk.newUserApi(getUserLibraryApi).markFavoriteItem({
        userId: remote.auth.currentUserId || '',
        itemId: props.item.Id
      });
    } else {
      isFavorite.value = false;

      await remote.sdk.newUserApi(getUserLibraryApi).unmarkFavoriteItem({
        userId: remote.auth.currentUserId || '',
        itemId: props.item.Id
      });
    }
  } catch {
    useSnackbar(t('unableToToggleLike'), 'error');

    isFavorite.value = !isFavorite.value;
  }
}
</script>
