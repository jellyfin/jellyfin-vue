<template>
  <AppBar />
  <NavigationDrawer
    :order="display.mobile.value ? -1 : undefined"
    :drawer-items="drawerItems" />
  <VMain>
    <div class="pa-s">
      <slot />
    </div>
  </VMain>
  <AudioControls />
  <PiPVideoPlayer
    v-if="
      playbackManager.currentlyPlayingMediaType === 'Video' &&
        !playerElement.isFullscreenVideoPlayer
    " />
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, onBeforeMount, onUnmounted, provide, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import type { DrawerItem } from '@/components/Layout/Navigation/NavigationDrawer.vue';
import { playbackManager } from '@/store/playbackManager';
import { playerElement } from '@/store/playerElement';
import { fetchIndexPage, getLibraryIcon } from '@/utils/items';

const display = useDisplay();
const navDrawer = ref(!display.mobile.value);

const { views } = await fetchIndexPage();

const drawerItems = computed<DrawerItem[]>(() => {
  return (views.value ?? []).map((view: BaseItemDto) => {
    return {
      icon: getLibraryIcon(view.CollectionType),
      title: view.Name ?? '',
      to: `/library/${String(view.Id)}`
    };
  });
});

watch(display.mobile, () => {
  navDrawer.value = !display.mobile;
});

provide('NavigationDrawer', navDrawer);
onBeforeMount(() => {
  document.documentElement.classList.remove('no-forced-scrollbar');
});
onUnmounted(() => {
  document.documentElement.classList.add('no-forced-scrollbar');
});
</script>
