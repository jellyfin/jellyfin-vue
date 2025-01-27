<template>
  <VAvatar
    :size="size">
    <JImg
      :src="getUserImageUrl(remote.auth.currentUser.value)"
      :alt="$t('userImage')">
      <template #placeholder>
        <VAvatar
          color="primary"
          :size="size">
          <JIcon
            class="i-mdi:account" />
        </VAvatar>
      </template>
    </JImg>
  </VAvatar>
</template>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { remote } from '#/plugins/remote';
import { getUserImageUrl } from '#/utils/images';

/**
 * TODO: In reality, rounded is unnecessary since it can be passed as fallthrough,
 * but it needs to be here since VAvatar expects a truly boolean and fallthroughs are passed as strings.
 * It also can't be passed as a prop, it needs to not specify a prop for it to work properly
 * in AppBar's button.
 */
const { user, size = 64, rounded } = defineProps<{
  user: UserDto;
  size?: number;
  rounded?: boolean;
}>();
</script>
