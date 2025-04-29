<template>
  <AppBarButtonLayout v-if="auth.currentUser.value">
    <template #icon>
      <UserImage
        :user="auth.currentUser.value"
        :size="40"
        rounded />
      <VMenu location="bottom">
        <VList
          class="uno-min-w-50"
          density="compact">
          <VListItem>
            <template #prepend>
              <UserImage
                :user="auth.currentUser.value"
                :size="40"
                rounded />
            </template>
            <template #title>
              <VListItemTitle class="text-body-1">
                {{ auth.currentUser.value.Name }}
              </VListItemTitle>
            </template>
            <template
              v-if="auth.currentUser.value.Policy?.IsAdministrator"
              #subtitle>
              <VListItemSubtitle>
                {{ $t('administrator') }}
                <JIcon class="i-mdi:key-chain uno-text-sm" />
              </VListItemSubtitle>
            </template>
          </VListItem>
          <VDivider class="my-2" />
          <VListItem
            v-for="(item, index) in menuItems"
            :key="`bottomMenuItems-${index}`"
            :title="item.title"
            @click="item.action">
            <template #prepend>
              <JIcon
                :class="item.icon"
                class="uno-w-10" />
            </template>
          </VListItem>
        </VList>
      </VMenu>
    </template>
    <template #tooltip>
      {{ auth.currentUser.value.Name }}
    </template>
  </AppBarButtonLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRouter } from 'vue-router';
import { remote } from '#/plugins/remote';

interface MenuItem {
  title: string;
  icon: string;
  action: () => void;
}

const router = useRouter();
const auth = remote.auth;
const { t } = useTranslation();

const menuItems = computed<MenuItem[]>(() => {
  const menuItems = [];

  if (auth.currentUser.value?.Policy?.IsAdministrator) {
    menuItems.push({
      title: t('metadataEditor'),
      icon: 'i-mdi:pencil',
      action: async (): Promise<void> => {
        await router.push('/metadata');
      }
    });
  }

  menuItems.push(
    {
      title: t('settings'),
      icon: 'i-mdi:cog',
      action: async (): Promise<void> => {
        await router.push('/settings');
      }
    },
    {
      title: t('logout'),
      icon: 'i-mdi:logout',
      action: async (): Promise<void> => {
        await auth.logoutCurrentUser();
      }
    }
  );

  return menuItems;
});
</script>
