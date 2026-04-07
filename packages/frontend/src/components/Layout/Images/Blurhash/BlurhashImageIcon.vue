<template>
  <JOverlay>
    <VAvatar
      v-if="getItemIcon(item)"
      :rounded="false"
      size="100%"
      class="d-flex justify-center align-center align-self-center uno-h-full uno-w-full">
      <JIcon
        class="text--disabled uno-h-[50%] uno-w-[50%]"
        :class="getItemIcon(item)" />
    </VAvatar>
  </JOverlay>
</template>

<script setup lang="ts">
import type {
  BaseItemDto, BaseItemPerson
} from '@jellyfin/sdk/lib/generated-client';
import { getItemIcon } from '#/utils/items';

const { item } = defineProps<{ item: BaseItemDto | BaseItemPerson }>();
</script>
