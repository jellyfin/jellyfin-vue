<template>
  <JAvatar
    :size="size">
    <JAvatarImage
      v-if="imageSrc"
      :src="imageSrc"
      :alt="$t('userImage')" />
    <JAvatarFallback class="uno-bg-primary">
      <JIcon class="i-mdi:account" />
    </JAvatarFallback>
  </JAvatar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { remote } from '#/plugins/remote/index.ts';
import { getUserImageUrl } from '#/utils/images.ts';

const { user, size = 64 } = defineProps<{
  user?: UserDto;
  size?: number;
}>();

const imageSrc = computed(() => getUserImageUrl(user ?? remote.auth.currentUser.value));
</script>
