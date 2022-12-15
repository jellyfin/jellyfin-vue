<template>
  <v-menu v-if="auth.currentUser.value" location="bottom">
    <template #activator="{ props }">
      <app-bar-button-layout v-bind="props">
        <template #icon>
          <user-image :user="auth.currentUser.value" :size="40" rounded />
        </template>
      </app-bar-button-layout>
    </template>
    <v-list class="min-list-width" dense>
      <v-list-item>
        <template #prepend>
          <v-avatar>
            <user-image :user="auth.currentUser.value" :size="40" rounded />
          </v-avatar>
        </template>
        <template #title>
          <v-list-item-title class="text-body-1">
            {{ auth.currentUser.value.Name }}
          </v-list-item-title>
        </template>
        <template
          v-if="auth.currentUser.value?.Policy?.IsAdministrator"
          #subtitle>
          <v-list-item-subtitle>
            {{ $t('administrator') }}
            <Icon size="small">
              <i-mdi-key-chain />
            </Icon>
          </v-list-item-subtitle>
        </template>
      </v-list-item>
      <v-divider class="my-2" />
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="`bottomMenuItems-${index}`"
        :prepend-icon="item.icon"
        :title="item.title"
        @click="item.action" />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import IMdiCog from 'virtual:icons/mdi/cog';
import IMdiLogout from 'virtual:icons/mdi/logout';
import IMdiPencil from 'virtual:icons/mdi/pencil';
import { useRemote } from '@/composables';

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
