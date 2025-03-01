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
        <JIcon class="i-mdi:arrow-left" />
      </template>
    </AppBarButtonLayout>
    <VSpacer />
    <SearchField />
    <VSpacer />
    <AppBarButtonLayout
      v-if="!(remote.socket.isConnected.value || isConnectedToServer)"
      :color="isConnectedToServer ? 'yellow' : 'red'">
      <template #icon>
        <JIcon class="i-mdi:network-off-outline" />
      </template>
      <template #tooltip>
        <span>{{ !remote.socket.isConnected.value ? $t('noWebSocketConnection') : $t('noServerConnection') }}</span>
      </template>
    </AppBarButtonLayout>
    <TaskManagerButton />
    <AppBarButtonLayout @click="switchColorTheme">
      <template #icon>
        <JIcon
          :class="{
            'i-mdi:weather-sunny': themeSettings.isAutoTheme.value,
            'i-mdi:weather-night': !themeSettings.currentThemeIsDark.value,
            'i-mdi:brightness-auto': themeSettings.currentThemeIsDark.value
          }" />
      </template>
      <template #tooltip>
        <span v-if="themeSettings.isAutoTheme.value">
          {{ $t('switchToLightMode') }}
        </span>
        <span v-else-if="themeSettings.currentThemeIsDark.value">
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
import { windowScroll, isConnectedToServer, transparencyEffects } from '#/store';
import { themeSettings } from '#/store/settings/theme';
import { remote } from '#/plugins/remote';
import { JView_isRouting } from '#/store/keys';

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
  if (themeSettings.isAutoTheme.value) {
    themeSettings.currentTheme.value = false;
  } else if (themeSettings.currentThemeIsDark.value) {
    themeSettings.currentTheme.value = undefined;
  } else {
    themeSettings.currentTheme.value = true;
  }
}

const navigationDrawer = inject<Ref<boolean>>('NavigationDrawer');
</script>

<style scoped>
.app-bar-safe-zone {
  height: calc(48px + env(safe-area-inset-top)) !important;
}
</style>
