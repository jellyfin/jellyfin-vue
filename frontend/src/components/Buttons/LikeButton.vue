<template>
  <v-btn
    :icon="isFavorite ? IMdiHeart : IMdiHeartOutline"
    size="small"
    :loading="loading"
    @click.stop.prevent="isFavorite = !isFavorite" />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import IMdiHeart from 'virtual:icons/mdi/heart';
import IMdiHeartOutline from 'virtual:icons/mdi/heart-outline';
import { useRemote } from '@/composables';

const props = defineProps<{ item: BaseItemDto }>();
const remote = useRemote();
const loading = ref(false);

const isFavorite = computed({
  get() {
    return props.item.UserData?.IsFavorite ?? false;
  },
  async set(newValue) {
    try {
      if (!props.item.Id) {
        throw new Error('Item has no Id');
      }

      loading.value = true;

      await (newValue
        ? remote.sdk.newUserApi(getUserLibraryApi).markFavoriteItem({
            userId: remote.auth.currentUserId || '',
            itemId: props.item.Id
          })
        : remote.sdk.newUserApi(getUserLibraryApi).unmarkFavoriteItem({
            userId: remote.auth.currentUserId || '',
            itemId: props.item.Id
          }));
      loading.value = false;
    } catch {
    } finally {
      loading.value = false;
    }
  }
});
</script>
