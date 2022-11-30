<template>
  <div>
    <v-avatar v-if="loading" color="primary" :size="size">
      <Icon :size="iconSize" dark>
        <i-mdi-account />
      </Icon>
    </v-avatar>
    <v-img
      v-show="!loading"
      ref="img"
      class="user-image"
      :src="userImage"
      :class="{ 'rounded-circle': rounded }"
      @load="loading = false" />
  </div>
</template>

<script setup lang="ts">
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, ref } from 'vue';
import { useRemote } from '@/composables';

const props = defineProps({
  user: {
    type: Object as () => UserDto,
    required: true
  },
  size: {
    type: Number,
    required: false,
    default: 64
  },
  quality: {
    type: Number,
    required: false,
    default: 90
  },
  rounded: {
    type: Boolean,
    default: false
  }
});

const remote = useRemote();

const loading = ref(true);
const img = ref<HTMLDivElement | undefined>(undefined);
const userImage = computed(() => {
  return props.user?.Id && props.user?.PrimaryImageTag
    ? `${remote.axios.instance.defaults.baseURL}/Users/${props.user.Id}/Images/Primary/?tag=${props.user.PrimaryImageTag}&quality=${props.quality}`
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
