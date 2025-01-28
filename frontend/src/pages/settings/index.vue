<template>
  <VContainer>
    <VRow class="pt-4">
      <VCol
        cols="12"
        offset-lg="1"
        md="5"
        lg="4"
        class="py-4">
        <div
          v-if="
            remote.auth.currentServer.value &&
              $remote.auth.currentUser?.value?.Policy?.IsAdministrator
          ">
          <JImg
            class="uno-h-25"
            src="/icon.svg"
            :alt="$t('jellyfinLogo')" />
          <VTable class="mb-4 pb-2 information">
            <tbody>
              <tr>
                <td>{{ $t('server') }}</td>
                <td>{{ remote.auth.currentServer.value?.ServerName }}</td>
              </tr>
              <tr>
                <td>{{ $t('serverVersion') }}</td>
                <td>{{ remote.auth.currentServer.value?.Version }}</td>
              </tr>
              <tr>
                <td>{{ $t('vueClientVersion') }}</td>
                <CommitLink v-if="commit_hash" />
                <td v-else>
                  {{ clientVersion }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
        <AboutLinks v-if="!$vuetify.display.mobile" />
      </VCol>
      <VCol
        cols="12"
        md="6"
        lg="5"
        class="py-4">
        <!-- User settings -->
        <VList
          lines="two"
          class="mb-4 overflow-y-hidden">
          <VItemGroup>
            <VListItem
              v-for="userItem in userItems"
              :key="userItem.name"
              :to="userItem.link"
              :disabled="!userItem.link">
              <template #prepend>
                <VAvatar>
                  <JIcon :class="userItem.icon" />
                </VAvatar>
              </template>
              <VListItemTitle>
                {{ userItem.name }}
              </VListItemTitle>
              <VListItemSubtitle>
                {{ userItem.description }}
              </VListItemSubtitle>
              <template #append>
                <VListItemAction>
                  <JIcon class="i-mdi:chevron-right" />
                </VListItemAction>
              </template>
            </VListItem>
          </VItemGroup>
        </VList>
        <!-- Administrator settings -->
        <div v-if="$remote.auth.currentUser.value?.Policy?.IsAdministrator">
          <VList
            v-for="(adminSection, index) in adminSections"
            :key="`admin-section-${index}`"
            class="mb-4 overflow-y-hidden">
            <VItemGroup>
              <VListItem
                v-for="adminItem in adminSection"
                :key="adminItem.name"
                :to="adminItem.link"
                :disabled="!adminItem.link">
                <template #prepend>
                  <VAvatar>
                    <JIcon :class="adminItem.icon" />
                  </VAvatar>
                </template>
                <VListItemTitle>
                  {{ adminItem.name }}
                </VListItemTitle>
                <VListItemSubtitle>
                  {{ adminItem.description }}
                </VListItemSubtitle>
                <template #append>
                  <VListItemAction>
                    <JIcon class="i-mdi:chevron-right" />
                  </VListItemAction>
                </template>
              </VListItem>
            </VItemGroup>
          </VList>
        </div>
        <AboutLinks v-if="$vuetify.display.mobile" />
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { commit_hash } from 'virtual:commit';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { remote } from '#/plugins/remote';
import { version as clientVersion } from '#/../package.json';
import { usePageTitle } from '#/composables/page-title';

const { t } = useI18n();

interface MenuOptions {
  icon: string;
  name: string;
  description: string;
  link?: RouteLocationRaw;
}

usePageTitle(() => t('settings'));

const userItems = computed<MenuOptions[]>(() => {
  return [
    {
      icon: 'i-mdi:account',
      name: t('account'),
      description: t('accountSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:home',
      name: t('homeScreen'),
      description: t('homeScreenSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:play-pause',
      name: t('playback'),
      description: t('playbackSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:disc-player',
      name: t('mediaPlayers'),
      description: t('mediaPlayersSettingsDescription'),
      link: undefined
    },
    {
      icon: 'i-mdi:subtitles',
      name: t('subtitles'),
      description: t('subtitlesSettingsDescription'),
      link: '/settings/subtitles'
    }
  ];
});

const adminSections = computed<MenuOptions[][]>(() => {
  return [
    [
      {
        icon: 'i-mdi:server',
        name: t('server'),
        description: t('serverSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:devices',
        name: t('devices'),
        description: t('devicesSettingsDescription'),
        link: '/settings/devices'
      },
      {
        icon: 'i-mdi:library-shelves',
        name: t('libraries'),
        description: t('librariesSettingsDescription'),
        link: undefined
      }
    ],
    [
      {
        icon: 'i-mdi:account-multiple',
        name: t('users'),
        description: t('userSettingsDescription'),
        link: '/settings/users'
      },
      {
        icon: 'i-mdi:key-chain',
        name: t('apiKeys'),
        description: t('apiKeysSettingsDescription'),
        link: '/settings/apikeys'
      }
    ],
    [
      {
        icon: 'i-mdi:play-network',
        name: t('transcodingAndStreaming'),
        description: t('transcodingSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:dlna',
        name: t('dlna'),
        description: t('dlnaSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:television-classic',
        name: t('liveTv'),
        description: t('liveTvSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:network',
        name: t('networking'),
        description: t('networkingSettingsDescription'),
        link: undefined
      }
    ],
    [
      {
        icon: 'i-mdi:puzzle',
        name: t('plugins'),
        description: t('pluginsSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:calendar-clock',
        name: t('scheduledTasks'),
        description: t('scheduledTasksSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:bell',
        name: t('notifications'),
        description: t('notificationsSettingsDescription'),
        link: undefined
      },
      {
        icon: 'i-mdi:text-box',
        name: t('logsAndActivity'),
        description: t('logsAndActivitySettingsDescription'),
        link: '/settings/logs-and-activity'
      }
    ]
  ];
});
</script>

<style scoped>
.information td {
  height: 3.4em !important;
  border-bottom: 0 !important;
}
</style>
