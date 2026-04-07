<template>
  <div
    class="j-splash"
    :class="themeSettings.currentTheme.value">
    <img
      src="./icon.svg"
      alt="Jellyfin Logo"
      decoding="sync">
    <JTransition
      name="slide-y-reverse"
      appear>
      <div class="uno-fixed uno-bottom-25 uno-w-full uno-flex uno-flex-col uno-items-center uno-gap-5">
        <JProgressCircular
          class="uno-w-20"
          indeterminate />
        <VBtn
          v-if="remote.auth.currentUser.value"
          @click="remote.auth.logoutCurrentUser">
          {{ $t('logout') }}
        </VBtn>
      </div>
    </JTransition>
  </div>
</template>

<script setup lang="ts">
import { remote } from '#/plugins/remote';
import { themeSettings } from '#/store/settings/theme';
</script>
