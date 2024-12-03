<template>
  <JOverlay>
    <VAvatar
      v-if="getItemIcon(item)"
      :rounded="false"
      size="100%"
      class="d-flex justify-center align-center align-self-center uno-h-full uno-w-full">
      <VIcon
        class="text--disabled placeholder"
        size="50%"
        :icon="getItemIcon(item)">
        <component :is="getItemIcon(item)" />
      </VIcon>
    </VAvatar>
  </JOverlay>
</template>

<script setup lang="ts">
import type {
  BaseItemDto, BaseItemPerson
} from '@jellyfin/sdk/lib/generated-client';
import { getItemIcon } from '@/utils/items';

const { item } = defineProps<{ item: BaseItemDto | BaseItemPerson }>();
</script>

<style scoped>
:deep(.placeholder svg) {
  width: 100%;
  height: 100%;
}
</style>
