<template>
  <AppBar />
  <NavigationDrawer
    :order="display.mobile.value ? -1 : undefined"
    :drawer-items="drawerItems" />
  <JMain>
    <div class="pa-s">
      <slot />
    </div>
  </JMain>
  <AudioControls />
  <MiniVideoPlayer
    v-if="
      playbackManager.isVideo.value
    " />
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, onBeforeMount, onUnmounted, provide, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import type { DrawerItem } from '#/components/Layout/Navigation/NavigationDrawer.vue';
import { playbackManager } from '#/store/playback-manager';
import { fetchIndexPage, getLibraryIcon } from '#/utils/items';

const display = useDisplay();
const navDrawer = ref(!display.mobile.value);

const { views } = await fetchIndexPage();

const drawerItems = computed<DrawerItem[]>(() => {
  return views.value.map((view: BaseItemDto) => {
    return {
      icon: getLibraryIcon(view.CollectionType),
      title: view.Name ?? '',
      to: `/library/${view.Id}`
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
