<template>
  <VNavigationDrawer
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    :order="props.order"
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
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useRoute } from 'vue-router/auto';
import { useI18n } from 'vue-i18n';
import { computed, inject, Ref } from 'vue';
import IMdiHome from 'virtual:icons/mdi/home';
import { userLibrariesStore } from '@/store';
import { getLibraryIcon } from '@/utils/items';

const props = defineProps<{
  order?: number;
}>();
const route = useRoute();
const userLibraries = userLibrariesStore();
const { t } = useI18n();

const drawer = inject<Ref<boolean>>('NavigationDrawer');

const transparentLayout = computed(() => {
  return route.meta.transparentLayout ?? false;
});

const drawerItems = computed(() => {
  return userLibraries.libraries.map((view: BaseItemDto) => {
    if (view.Id) {
      return {
        icon: getLibraryIcon(view.CollectionType),
        title: view.Name ?? '',
        to: `/library/${view.Id}`
      };
    }
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
