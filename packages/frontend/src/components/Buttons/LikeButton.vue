<template>
  <VBtn
    icon
    :size="size"
    :color="isFavorite ? 'primary' : undefined"
    :loading="loading"
    @click.stop.prevent="isFavorite = !isFavorite">
    <JIcon :class="isFavorite ? 'i-mdi:heart' : 'i-mdi:heart-outline'" />
  </VBtn>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed, ref } from 'vue';
import { useApi } from '#/composables/apis';

const { size = 'small', item } = defineProps<{ item: BaseItemDto; size?: string }>();
/**
 * We use the composables to handle when there's no connection to the server
 *
 * The websocket will automatically update the item in the store, so no need
 * to do manual modification here
 */
const methodToExecute = ref<'markFavoriteItem' | 'unmarkFavoriteItem' | undefined>();
const { loading } = await useApi(getUserLibraryApi, methodToExecute, { skipCache: { request: true }, globalLoading: false })(() => ({
  itemId: item.Id ?? ''
}));

const isFavorite = computed({
  get() {
    return item.UserData?.IsFavorite ?? false;
  },
  set(newValue) {
    methodToExecute.value = newValue ? 'markFavoriteItem' : 'unmarkFavoriteItem';
  }
});
</script>
