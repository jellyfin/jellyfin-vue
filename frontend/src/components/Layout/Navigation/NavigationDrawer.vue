<template>
  <v-navigation-drawer
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    floating
    class="pa-s"
    :color="
      transparentLayout && !$vuetify.display.mobile
        ? 'transparent'
        : 'background'
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
        v-for="library in userViews.getNavigationDrawerItems"
        :key="library.to"
        :to="library.to"
        exact
        :prepend-icon="library.icon"
        :title="library.title" />
    </v-list>
    <template #append>
      <commit-link />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { computed, inject, Ref } from 'vue';
import { userViewsStore } from '~/store';
import IMdiHome from '~icons/mdi/home';

const route = useRoute();
const userViews = userViewsStore();
const { t } = useI18n();

userViews.refreshUserViews();

const drawer = inject<Ref<boolean>>('NavigationDrawer');

const transparentLayout = computed(() => {
  return route.meta.transparentLayout || false;
});

const items = [
  {
    icon: IMdiHome,
    title: t('home'),
    to: '/'
  }
];
</script>
