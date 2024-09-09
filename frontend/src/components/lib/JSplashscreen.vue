<template>
  <div
    class="j-splash"
    :class="clientSettings.currentTheme.value">
    <img
      src="./icon.svg"
      alt="Jellyfin Logo"
      loading="eager"
      decoding="sync">
    <JTransition
      name="slide-y-reverse"
      appear>
      <div class="uno-fixed uno-bottom-25 uno-w-full uno-flex uno-flex-col uno-items-center uno-gap-5">
        <VProgressCircular indeterminate />
        <VBtn
          v-if="remote.auth.currentUser"
          @click="remote.auth.logoutCurrentUser">
          {{ $t('logout') }}
        </VBtn>
      </div>
    </JTransition>
  </div>
</template>

<script setup lang="ts">
import { remote } from '@/plugins/remote';
import { clientSettings } from '@/store/client-settings';
</script>
