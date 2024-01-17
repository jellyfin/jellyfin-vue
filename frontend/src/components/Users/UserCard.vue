<template>
  <JHover v-slot="{ isHovering, hoverProps }">
    <div
      class="ma-2 d-flex flex-column pointer"
      v-bind="hoverProps"
      @click="$emit('connect', user)">
      <VBtn
        :active="isHovering"
        variant="plain"
        :height="128"
        :width="128"
        icon>
        <UserImage
          :user="user"
          rounded
          :size="128" />
      </VBtn>
      <a class="text-subtitle-1 text-center mt-2 link">
        {{ user.Name }}
      </a>
    </div>
  </JHover>
</template>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';

defineProps<{ user: UserDto }>();

defineEmits<{
  connect: [user: UserDto];
}>();
</script>
