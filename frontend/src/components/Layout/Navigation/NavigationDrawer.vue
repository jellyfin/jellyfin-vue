<template>
  <v-navigation-drawer
    ref="navDrawer"
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    :order="props.order"
    floating
    class="pa-s"
    :color="
      transparentLayout && !$vuetify.display.mobile ? 'transparent' : undefined
    ">
    <v-list
      v-focus-section:nav="{
        leaveFor: { right: '@app, @lib-grid, @series, @main', left: '@app' }
      }"
      nav>
      <v-list-item
        v-for="item in items"
        :key="item.to"
        v-focus-events="{ unfocused: handleUnfocus }"
        v-focus
        :to="item.to"
        exact
        :prepend-icon="item.icon"
        :title="item.title"
        @focus="handleFocus" />
      <v-list-subheader>{{ $t('libraries') }}</v-list-subheader>
      <v-list-item
        v-for="library in drawerItems"
        :key="library.to"
        v-focus-events="{ unfocused: handleUnfocus }"
        v-focus
        :to="library.to"
        exact
        :prepend-icon="library.icon"
        :title="library.title"
        @focus="handleFocus" />
    </v-list>
    <template #append>
      <v-list nav>
        <commit-link />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { computed, inject, ref, Ref } from 'vue';
import IMdiHome from 'virtual:icons/mdi/home';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { userLibrariesStore } from '@/store';
import { getLibraryIcon } from '@/utils/items';

const route = useRoute();
const userLibraries = userLibrariesStore();
const { t } = useI18n();

const props = defineProps<{
  order?: number;
}>();

const drawer = inject<Ref<boolean>>('NavigationDrawer');
const navDrawer = ref<VNavigationDrawer>(null);

const transparentLayout = computed(() => {
  return route.meta.transparentLayout || false;
});

const drawerItems = computed(() => {
  return userLibraries.libraries.map((view: BaseItemDto) => {
    return {
      icon: getLibraryIcon(view.CollectionType),
      title: view.Name || '',
      to: `/library/${view.Id}`
    };
  });
});

/**
 * Opens the drawer when any item in it gains focus
 */
function handleFocus(): void {
  if (navDrawer.value.temporary && !drawer.value) {
    drawer.value = true;
  }
}
/**
 * Closes the drawer when focus is law
 */
function handleUnfocus(
  nextElement: HTMLElement,
  nextSectionId: string,
  direction: 'left' | 'right' | 'up' | 'down',
  native: boolean
): void {
  if (navDrawer.value.temporary && nextSectionId != 'nav') {
    drawer.value = false;
  }
}

const items = [
  {
    icon: IMdiHome,
    title: t('home'),
    to: '/'
  }
];
</script>
