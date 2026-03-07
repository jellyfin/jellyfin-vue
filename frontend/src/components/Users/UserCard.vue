<template>
  <JHover v-slot="{ isHovering }">
    <div
      class="uno-m-2 uno-flex uno-flex-column pointer"
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
      <a class="uno-text-center link text-subtitle-1 uno-mt-2">
        {{ user.Name }}
      </a>
    </div>
  </JHover>
</template>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';

const { user } = defineProps<{ user: UserDto }>();

defineEmits<{
  connect: [user: UserDto];
}>();
</script>
