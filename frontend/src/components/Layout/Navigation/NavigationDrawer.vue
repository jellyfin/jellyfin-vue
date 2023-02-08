<template>
  <v-navigation-drawer
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    :order="props.order"
    floating
    class="pa-s"
    :color="
      transparentLayout && !$vuetify.display.mobile ? 'transparent' : undefined
    ">
    <v-list nav>
      <v-list-item
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        exact
        :prepend-icon="item.icon"
        :title="item.title" />
      <v-list-subheader>{{ $t('libraries') }}</v-list-subheader>
      <v-list-item
        v-for="library in drawerItems"
        :key="library.to"
        :to="library.to"
        exact
        :prepend-icon="library.icon"
        :title="library.title" />
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
import { computed, inject, Ref } from 'vue';
import IMdiHome from 'virtual:icons/mdi/home';
import { userLibrariesStore } from '@/store';
import { getLibraryIcon } from '@/utils/items';

const route = useRoute();
const userLibraries = userLibrariesStore();
const { t } = useI18n();

const props = defineProps<{
  order?: number;
}>();

const drawer = inject<Ref<boolean>>('NavigationDrawer');

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

const items = [
  {
    icon: IMdiHome,
    title: t('home'),
    to: '/'
  }
];
</script>
