<template>
  <VAvatar :size="size">
    <JImg
      :src="url"
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

const props = withDefaults(
  defineProps<{
    user: UserDto;
    size?: number;
    rounded?: boolean;
  }>(),
  { size: 64, rounded: false }
);

const url = computed(() => {
  return props.user.Id && props.user.PrimaryImageTag && remote.sdk.api?.basePath
    ? `${remote.sdk.api.basePath}/Users/${props.user.Id}/Images/Primary/?tag=${props.user.PrimaryImageTag}`
    : undefined;
});
const iconSize = computed(() => {
  return props.size * 0.75;
});
</script>
