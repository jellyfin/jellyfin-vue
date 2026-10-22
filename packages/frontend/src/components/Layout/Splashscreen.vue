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
      <div class="uno-flex uno-flex-col uno-gap-5 uno-w-full uno-items-center uno-bottom-25 uno-fixed">
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
import { remote } from '#/plugins/remote/index.ts';
import { themeSettings } from '#/store/settings/theme.ts';
</script>
