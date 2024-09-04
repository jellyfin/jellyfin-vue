<template>
  <VAvatar
    :size="size">
    <JImg
      :src="url"
      :alt="$t('userImage')"
      :transition-props="{
        mode: 'out-in'
      }">
      <template #placeholder>
        <VAvatar
          color="primary"
          :size="size">
          <VIcon :size="iconSize">
            <IMdiAccount />
          </VIcon>
        </VAvatar>
      </template>
    </JImg>
  </VAvatar>
</template>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { remote } from '@/plugins/remote';

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

const url = computed(() => {
  return user.Id && user.PrimaryImageTag && remote.sdk.api?.basePath
    ? `${remote.sdk.api.basePath}/Users/${user.Id}/Images/Primary/?tag=${user.PrimaryImageTag}`
    : undefined;
});
const iconSize = computed(() => {
  return size * 0.75;
});
</script>
