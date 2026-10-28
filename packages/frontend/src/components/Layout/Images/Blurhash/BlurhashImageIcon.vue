<template>
  <JOverlay>
    <div
      v-if="getItemIcon(item)"
      class="uno-h-full uno-w-full uno-flex uno-items-center uno-justify-center"
      style="background: rgb(var(--v-theme-surface))">
      <JIcon
        class="text--disabled uno-h-[50%] uno-w-[50%]"
        :class="getItemIcon(item)" />
    </div>
  </JOverlay>
</template>

<script setup lang="ts">
import type {
  BaseItemDto, BaseItemPerson
} from '@jellyfin/sdk/lib/generated-client';
import { getItemIcon } from '#/utils/items.ts';

const { item } = defineProps<{ item: BaseItemDto | BaseItemPerson }>();
</script>
