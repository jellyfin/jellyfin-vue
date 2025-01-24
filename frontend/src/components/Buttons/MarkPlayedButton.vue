<template>
  <VBtn
    v-if="canMarkWatched(item)"
    :color="isPlayed ? 'primary' : undefined"
    icon
    :loading="loading"
    size="small"
    @click.stop.prevent="isPlayed = !isPlayed">
    <JIcon class="i-mdi:check" />
  </VBtn>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { computed, ref } from 'vue';
import { canMarkWatched } from '#/utils/items';
import { useApi } from '#/composables/apis';

const { item } = defineProps<{
  item: BaseItemDto;
}>();

const methodToExecute = ref<'markPlayedItem' | 'markUnplayedItem' | undefined>();

/**
 * We use the composables to handle when there's no connection to the server
 *
 * The websocket will automatically update the item in the store, so no need
 * to do manual modification here
 */
const { loading } = await useApi(getPlaystateApi, methodToExecute, { skipCache: { request: true }, globalLoading: false })(() => ({
  itemId: item.Id ?? ''
}));

const isPlayed = computed({
  get() {
    return item.UserData?.Played;
  },
  set(newValue) {
    methodToExecute.value = newValue ? 'markPlayedItem' : 'markUnplayedItem';
  }
});
</script>
