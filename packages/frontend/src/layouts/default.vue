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
import { computed, provide, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import type { DrawerItem } from '#/components/Layout/Navigation/NavigationDrawer.vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { userSettings } from '#/store/settings/user.ts';
import { fetchIndexPage, getLibraryIcon } from '#/utils/items.ts';
import { orderItemsById } from '#/utils/ordering.ts';

const display = useDisplay();
const navDrawer = ref(!display.mobile.value);

const { views } = await fetchIndexPage();
const orderedViews = computed(() => orderItemsById(views.value, userSettings.libraryOrder.value));

const drawerItems = computed<DrawerItem[]>(() => {
  return orderedViews.value.map((view: BaseItemDto) => {
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
</script>
