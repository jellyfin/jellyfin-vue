<template>
  <div class="j-splash" :class="clientSettings.currentTheme.value">
    <img src="./icon.svg" alt="Jellyfin Logo">
    <JTransition name="slide-y-reverse" appear important>
      <div class="uno-flex uno-flex-col uno-gap-5 uno-bottom-25 uno-fixed uno-w-full uno-items-center">
        <VProgressCircular indeterminate />
        <VBtn v-if="remote.auth.currentUser" @click="remote.auth.logoutCurrentUser">
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
