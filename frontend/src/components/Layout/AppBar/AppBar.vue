<template>
  <VAppBar
    class="app-bar-safe-zone"
    :color="transparentAppBar ? 'transparent' : undefined"
    density="compact"
    flat>
    <LoadingIndicator />
    <VAppBarNavIcon
      v-if="$vuetify.display.mobile"
      @click="navigationDrawer = !navigationDrawer" />
    <AppBarButtonLayout @click="$router.back()">
      <template #icon>
        <VIcon>
          <IMdiArrowLeft />
        </VIcon>
      </template>
    </AppBarButtonLayout>
    <VSpacer />
    <SearchField />
    <VSpacer />
    <AppBarButtonLayout
      v-hide="remote.socket.isConnected.value && isConnectedToServer"
      :color="isConnectedToServer ? 'yellow' : 'red'">
      <template #icon>
        <VIcon>
          <IMdiNetworkOffOutline />
        </VIcon>
      </template>
      <template #tooltip>
        <span>{{ !remote.socket.isConnected.value ? $t('noWebSocketConnection') : $t('noServerConnection') }}</span>
      </template>
    </AppBarButtonLayout>
    <TaskManagerButton />
    <AppBarButtonLayout @click="switchColorTheme">
      <template #icon>
        <VIcon>
          <IMdiBrightnessAuto v-if="clientSettings.isAutoTheme.value" />
          <IMdiWeatherSunny v-else-if="clientSettings.currentThemeIsDark.value" />
          <IMdiWeatherNight v-else />
        </VIcon>
      </template>
      <template #tooltip>
        <span v-if="clientSettings.isAutoTheme.value">
          {{ $t('switchToLightMode') }}
        </span>
        <span v-else-if="clientSettings.currentThemeIsDark.value">
          {{ $t('followSystemTheme') }}
        </span>
        <span v-else>
          {{ $t('switchToDarkMode') }}
        </span>
      </template>
    </AppBarButtonLayout>
    <!-- Uncomment when some of the remote play features are fully implemented -->
    <!-- <cast-button /> -->
    <UserButton />
    <LocaleSwitcher elevated />
  </VAppBar>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import { windowScroll, isConnectedToServer, transparencyEffects } from '@/store';
import { clientSettings } from '@/store/client-settings';
import { remote } from '@/plugins/remote';
import { JView_isRouting } from '@/store/keys';

const { y } = windowScroll;
const isRouting = inject(JView_isRouting);
const transparentAppBar = computed(previous => isRouting?.value ? previous : transparencyEffects.value && y.value < 10);

/**
 * Cycle between the different color schemas
 */
function switchColorTheme(): void {
  /**
   * 1. If auto, we go to light
   * 2. If dark, we go to auto
   * 3. If light, we go to dark
   */
  if (clientSettings.isAutoTheme.value) {
    clientSettings.currentTheme.value = false;
  } else if (clientSettings.currentThemeIsDark.value) {
    clientSettings.currentTheme.value = undefined;
  } else {
    clientSettings.currentTheme.value = true;
  }
}

const navigationDrawer = inject<Ref<boolean>>('NavigationDrawer');
</script>

<style scoped>
.app-bar-safe-zone {
  height: calc(48px + env(safe-area-inset-top)) !important;
}
</style>
