<template>
  <VBtn
    :icon="isFavorite ? IMdiHeart : IMdiHeartOutline"
    :size="size"
    :color="isFavorite ? 'primary' : undefined"
    :loading="loading"
    @click.stop.prevent="isFavorite = !isFavorite" />
</template>

<script setup lang="ts">
import { remote } from '@/plugins/remote';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import IMdiHeart from 'virtual:icons/mdi/heart';
import IMdiHeartOutline from 'virtual:icons/mdi/heart-outline';
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{ item: BaseItemDto; size?: string }>(),
  {
    size: 'small'
  }
);
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
          userId: remote.auth.currentUserId ?? '',
          itemId: props.item.Id
        })
        : remote.sdk.newUserApi(getUserLibraryApi).unmarkFavoriteItem({
          userId: remote.auth.currentUserId ?? '',
          itemId: props.item.Id
        }));
    } catch {} finally {
      loading.value = false;
    }
  }
});
</script>
