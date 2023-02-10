<template>
  <v-avatar :size="size">
    <v-img :src="url" :width="size" cover>
      <template #placeholder>
        <v-avatar color="primary" :size="size">
          <v-icon :size="iconSize" dark>
            <i-mdi-account />
          </v-icon>
        </v-avatar>
      </template>
    </v-img>
  </v-avatar>
</template>

<script setup lang="ts">
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useRemote } from '@/composables';

const props = withDefaults(
  defineProps<{
    user: UserDto;
    size?: number;
    quality?: number;
    rounded?: boolean;
  }>(),
  { size: 64, quality: 90, rounded: false }
);

const remote = useRemote();

const url = computed(() => {
  return props.user?.Id && props.user?.PrimaryImageTag
    ? `${remote.sdk.api?.basePath}/Users/${props.user.Id}/Images/Primary/?tag=${props.user.PrimaryImageTag}&quality=${props.quality}`
    : undefined;
});
const iconSize = computed(() => {
  return props.size * 0.75;
});
</script>

<style lang="scss" scoped>
.user-image {
  background-size: cover;
  background-position: center center;
}
</style>
