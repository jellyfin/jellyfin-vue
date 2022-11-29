<template>
  <v-navigation-drawer
    v-model="model.value"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    floating
    class="pa-s"
    :class="{
      transparent: transparentLayout && !$vuetify.display.mobile
    }">
    <v-list nav>
      <v-list-item v-for="item in items" :key="item.to" :to="item.to" exact>
        <v-list-item-action>
          <v-icon :icon="item.icon" />
        </v-list-item-action>
        <v-list-item-title>
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
      <v-list-subheader>{{ $t('libraries') }}</v-list-subheader>
      <v-list-item
        v-for="library in userViews.getNavigationDrawerItems"
        :key="library.to"
        :to="library.to"
        exact>
        <v-list-item-action>
          <v-icon :icon="library.icon" />
        </v-list-item-action>
        <v-list-item-title>
          {{ library.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <template #append>
      <commit-link />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { userViewsStore } from '~/store';
import IMdiHome from '~icons/mdi/home';

interface LayoutButton {
  icon: typeof IMdiHome;
  title: string;
  to: string;
}

const route = useRoute();
const userViews = userViewsStore();
const display = useDisplay();
const { t } = useI18n();
const model = computed(() => {
  return display.mobile;
});

const transparentLayout = computed(() => {
  return route.meta.transparentLayout || false;
});
const items = computed<LayoutButton[]>(() => {
  return [
    {
      icon: IMdiHome,
      title: t('home'),
      to: '/'
    }
  ];
});
</script>
