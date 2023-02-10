<template>
  <v-hover v-slot="{ isHovering, props: hoverProps }">
    <div
      class="ma-2 d-flex flex-column pointer"
      v-bind="hoverProps"
      @click="$emit('connect', user)">
      <v-btn
        :active="isHovering"
        variant="plain"
        :height="128"
        :width="128"
        icon>
        <user-image :user="user" rounded :size="128" />
      </v-btn>
      <a class="text-subtitle-1 text-center mt-2 link">
        {{ user.Name }}
      </a>
    </div>
  </v-hover>
</template>

<script setup lang="ts">
import { UserDto } from '@jellyfin/sdk/lib/generated-client';

defineProps<{ user: UserDto }>();

defineEmits<{
  (e: 'connect', user: UserDto): void;
}>();
</script>
