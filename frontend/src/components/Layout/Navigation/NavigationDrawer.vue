<template>
  <VNavigationDrawer
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    :order="order"
    floating
    class="pa-s"
    :color="
      transparentLayout && !$vuetify.display.mobile ? 'transparent' : undefined
    ">
    <VList nav>
      <VListItem
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        exact
        :prepend-icon="item.icon"
        :title="item.title" />
      <VListSubheader>{{ $t('libraries') }}</VListSubheader>
      <template v-for="library in drawerItems">
        <VListItem
          v-if="library"
          :key="library.to"
          :to="library.to"
          exact
          :prepend-icon="library.icon"
          :title="library.title" />
      </template>
    </VList>
    <template #append>
      <VList nav>
        <CommitLink />
      </VList>
    </template>
  </VNavigationDrawer>
</template>

<script setup lang="ts">
import IMdiHome from 'virtual:icons/mdi/home';
import { computed, inject, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteNamedMap } from 'vue-router/auto-routes';
import type { getLibraryIcon } from '@/utils/items';
import { transparencyEffects } from '@/store';
import { JView_isRouting } from '@/store/keys';

export interface DrawerItem {
  icon: ReturnType<typeof getLibraryIcon>;
  title: string;
  to: keyof RouteNamedMap;
}

const { order, drawerItems } = defineProps<{
  order?: number;
  drawerItems: DrawerItem[];
}>();

const { t } = useI18n();

const drawer = inject<Ref<boolean>>('NavigationDrawer');
const isRouting = inject(JView_isRouting);
const transparentLayout = computed(previous => isRouting?.value ? previous : transparencyEffects.value);

const items = [
  {
    icon: IMdiHome,
    title: t('home'),
    to: '/'
  }
];
</script>
