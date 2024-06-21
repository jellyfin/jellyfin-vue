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
      v-if="!remote.socket.isConnected.value || !isConnectedToServer"
      :color="!remote.socket.isConnected.value ? 'yellow' : 'red'">
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
          <IMdiBrightnessAuto v-if="clientSettings.darkMode === 'auto'" />
          <IMdiWeatherSunny v-else-if="clientSettings.darkMode" />
          <IMdiWeatherNight v-else />
        </VIcon>
      </template>
      <template #tooltip>
        <span v-if="clientSettings.darkMode === 'auto'">
          {{ $t('switchToDarkMode') }}
        </span>
        <span v-else-if="clientSettings.darkMode">
          {{ $t('switchToLightMode') }}
        </span>
        <span v-else>
          {{ $t('followSystemTheme') }}
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
import { useRoute } from 'vue-router';
import { windowScroll, isConnectedToServer } from '@/store';
import { clientSettings } from '@/store/client-settings';
import { remote } from '@/plugins/remote';

const route = useRoute();
const { y } = windowScroll;
const transparentAppBar = computed(() => route.meta.layout.transparent && y.value < 10);

/**
 * Cycle between the different color schemas
 */
function switchColorTheme(): void {
  if (clientSettings.darkMode === 'auto') {
    clientSettings.darkMode = true;
  } else if (clientSettings.darkMode) {
    clientSettings.darkMode = false;
  } else {
    clientSettings.darkMode = 'auto';
  }
}

const navigationDrawer = inject<Ref<boolean>>('NavigationDrawer');
</script>

<style scoped>
.app-bar-safe-zone {
  height: calc(48px + env(safe-area-inset-top)) !important;
}
</style>
