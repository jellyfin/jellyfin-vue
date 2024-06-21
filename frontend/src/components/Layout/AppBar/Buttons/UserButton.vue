<template>
  <AppBarButtonLayout v-if="auth.currentUser">
    <template #icon>
      <UserImage
        :user="auth.currentUser"
        :size="40"
        rounded />
      <VMenu location="bottom">
        <VList
          class="min-list-width"
          density="compact">
          <VListItem>
            <template #prepend>
              <UserImage
                :user="auth.currentUser"
                :size="40"
                rounded />
            </template>
            <template #title>
              <VListItemTitle class="text-body-1">
                {{ auth.currentUser.Name }}
              </VListItemTitle>
            </template>
            <template
              v-if="auth.currentUser?.Policy?.IsAdministrator"
              #subtitle>
              <VListItemSubtitle>
                {{ $t('administrator') }}
                <VIcon size="small">
                  <IMdiKeyChain />
                </VIcon>
              </VListItemSubtitle>
            </template>
          </VListItem>
          <VDivider class="my-2" />
          <VListItem
            v-for="(item, index) in menuItems"
            :key="`bottomMenuItems-${index}`"
            :prepend-icon="item.icon"
            :title="item.title"
            @click="item.action" />
        </VList>
      </VMenu>
    </template>
  </AppBarButtonLayout>
</template>

<script setup lang="ts">
import IMdiCog from 'virtual:icons/mdi/cog';
import IMdiLogout from 'virtual:icons/mdi/logout';
import IMdiPencil from 'virtual:icons/mdi/pencil';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { remote } from '@/plugins/remote';

interface MenuItem {
  title: string;
  icon: typeof IMdiPencil;
  action: () => void;
}

const router = useRouter();
const auth = remote.auth;
const { t } = useI18n();

const menuItems = computed<MenuItem[]>(() => {
  const menuItems = [];

  if (auth.currentUser?.Policy?.IsAdministrator) {
    menuItems.push({
      title: t('metadataEditor'),
      icon: IMdiPencil,
      action: async (): Promise<void> => {
        await router.push('/metadata');
      }
    });
  }

  menuItems.push(
    {
      title: t('settings'),
      icon: IMdiCog,
      action: async (): Promise<void> => {
        await router.push('/settings');
      }
    },
    {
      title: t('logout'),
      icon: IMdiLogout,
      action: async (): Promise<void> => {
        await auth.logoutCurrentUser();
      }
    }
  );

  return menuItems;
});
</script>

<style scoped>
.min-list-width {
  min-width: 200px;
}
</style>
