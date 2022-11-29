<template>
  <v-menu v-if="auth.currentUser.value" offset-y>
    <template #activator="{ on, attrs }">
      <app-bar-button-layout :custom-listener="on" v-bind="attrs">
        <template #icon>
          <user-image :user="auth.currentUser.value" :size="40" rounded />
        </template>
      </app-bar-button-layout>
    </template>
    <v-list class="min-list-width" dense>
      <v-list-item>
        <v-avatar>
          <user-image :user="auth.currentUser.value" :size="40" rounded />
        </v-avatar>
        <v-list-item-title class="text-body-1">
          {{ auth.currentUser.value.Name }}
        </v-list-item-title>
        <v-list-item-subtitle
          v-if="auth.currentUser.value?.Policy?.IsAdministrator">
          {{ $t('administrator') }}
          <Icon size="small">
            <i-mdi-key-chain />
          </Icon>
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider class="my-2" light />
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="`bottomMenuItems-${index}`"
        @click="item.action">
        <Icon size="small">
          {{ item.icon }}
        </Icon>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRemote } from '@/composables';
import IMdiCog from '~icons/mdi/cog';
import IMdiLogout from '~icons/mdi/logout';
import IMdiPencil from '~icons/mdi/pencil';

interface MenuItem {
  title: string;
  icon: typeof IMdiPencil;
  action: () => void;
}

const router = useRouter();
const auth = useRemote().auth;
const { t } = useI18n();

const menuItems = computed<MenuItem[]>(() => {
  const menuItems = [];

  if (auth.currentUser.value?.Policy?.IsAdministrator) {
    menuItems.push({
      title: t('metadataEditor'),
      icon: IMdiPencil,
      action: (): void => {
        router.push('/metadata');
      }
    });
  }

  menuItems.push(
    {
      title: t('settings.settings'),
      icon: IMdiCog,
      action: (): void => {
        router.push('/settings');
      }
    },
    {
      title: t('logout'),
      icon: IMdiLogout,
      action: (): void => {
        auth.logoutCurrentUser();
      }
    }
  );

  return menuItems;
});
</script>

<style lang="scss" scoped>
.space-evenly {
  flex: 1 !important;
  justify-content: space-evenly !important;
}

.no-overflow {
  max-width: 100%;
}

.user-select-none {
  user-select: none;
}

.min-list-width {
  min-width: 200px;
}
</style>
