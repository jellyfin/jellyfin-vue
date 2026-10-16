<template>
  <JOverlay>
    <VAvatar
      v-if="getItemIcon(item)"
      :rounded="false"
      size="100%"
      class="uno-h-full uno-w-full uno-flex uno-items-center uno-self-center uno-justify-center">
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
import { getItemIcon } from '#/utils/items.ts';

const { item } = defineProps<{ item: BaseItemDto | BaseItemPerson }>();
</script>
