<template>
  <div class="ma-2 d-flex flex-column pointer" @click="$emit('connect', user)">
    <v-btn variant="plain" ripple :height="128" :width="128">
      <user-image :size="128" :user="user" rounded />
    </v-btn>
    <a class="text-subtitle-1 text-center mt-2 link">
      {{ user.Name }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { UserDto } from '@jellyfin/sdk/lib/generated-client';

defineProps({
  user: {
    required: true,
    type: Object as () => UserDto
  }
});

defineEmits<{
  (e: 'connect', user: UserDto): void;
}>();
</script>
