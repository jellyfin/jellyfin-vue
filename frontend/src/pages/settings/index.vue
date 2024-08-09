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
            remote.auth.currentServer &&
              $remote.auth.currentUser?.Policy?.IsAdministrator
          ">
          <JImg
            class="logo"
            src="/icon.svg"
            :alt="$t('jellyfinLogo')" />
          <VTable class="mb-4 pb-2 information">
            <tbody>
              <tr>
                <td>{{ $t('server') }}</td>
                <td>{{ remote.auth.currentServer.ServerName }}</td>
              </tr>
              <tr>
                <td>{{ $t('serverVersion') }}</td>
                <td>{{ remote.auth.currentServer.Version }}</td>
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
                  <VIcon>
                    <component :is="userItem.icon" />
                  </VIcon>
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
                  <VIcon>
                    <IMdiChevronRight />
                  </VIcon>
                </VListItemAction>
              </template>
            </VListItem>
          </VItemGroup>
        </VList>
        <!-- Administrator settings -->
        <div v-if="$remote.auth.currentUser?.Policy?.IsAdministrator">
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
                    <VIcon>
                      <component :is="adminItem.icon" />
                    </VIcon>
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
                    <VIcon>
                      <IMdiChevronRight />
                    </VIcon>
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
import IMdiAccount from 'virtual:icons/mdi/account';
import IMdiAccountMultiple from 'virtual:icons/mdi/account-multiple';
import IMdiBell from 'virtual:icons/mdi/bell';
import IMdiCalendarClock from 'virtual:icons/mdi/calendar-clock';
import IMdiDevices from 'virtual:icons/mdi/devices';
import IMdiDiscPlayer from 'virtual:icons/mdi/disc-player';
import IMdiDLNA from 'virtual:icons/mdi/dlna';
import IMdiHome from 'virtual:icons/mdi/home';
import IMdiKeyChain from 'virtual:icons/mdi/key-chain';
import IMdiLibraryShelves from 'virtual:icons/mdi/library-shelves';
import IMdiNetwork from 'virtual:icons/mdi/network';
import IMdiPlayNetwork from 'virtual:icons/mdi/play-network';
import IMdiPlayPause from 'virtual:icons/mdi/play-pause';
import IMdiPuzzle from 'virtual:icons/mdi/puzzle';
import IMdiServer from 'virtual:icons/mdi/server';
import IMdiSubtitles from 'virtual:icons/mdi/subtitles';
import IMdiTelevisionClassic from 'virtual:icons/mdi/television-classic';
import IMdiTextBox from 'virtual:icons/mdi/text-box';
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { remote } from '@/plugins/remote';
import { version as clientVersion } from '@/../package.json';
import { usePageTitle } from '@/composables/page-title';

const { t } = useI18n();

interface MenuOptions {
  icon: Component;
  name: string;
  description: string;
  link?: RouteLocationRaw;
}

usePageTitle(() => t('settings'));

const userItems = computed<MenuOptions[]>(() => {
  return [
    {
      icon: IMdiAccount,
      name: t('account'),
      description: t('accountSettingsDescription'),
      link: undefined
    },
    {
      icon: IMdiHome,
      name: t('homeScreen'),
      description: t('homeScreenSettingsDescription'),
      link: undefined
    },
    {
      icon: IMdiPlayPause,
      name: t('playback'),
      description: t('playbackSettingsDescription'),
      link: undefined
    },
    {
      icon: IMdiDiscPlayer,
      name: t('mediaPlayers'),
      description: t('mediaPlayersSettingsDescription'),
      link: undefined
    },
    {
      icon: IMdiSubtitles,
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
        icon: IMdiServer,
        name: t('server'),
        description: t('serverSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiDevices,
        name: t('devices'),
        description: t('devicesSettingsDescription'),
        link: '/settings/devices'
      },
      {
        icon: IMdiLibraryShelves,
        name: t('libraries'),
        description: t('librariesSettingsDescription'),
        link: undefined
      }
    ],
    [
      {
        icon: IMdiAccountMultiple,
        name: t('users'),
        description: t('userSettingsDescription'),
        link: '/settings/users'
      },
      {
        icon: IMdiKeyChain,
        name: t('apiKeys'),
        description: t('apiKeysSettingsDescription'),
        link: '/settings/apikeys'
      }
    ],
    [
      {
        icon: IMdiPlayNetwork,
        name: t('transcodingAndStreaming'),
        description: t('transcodingSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiDLNA,
        name: t('dlna'),
        description: t('dlnaSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiTelevisionClassic,
        name: t('liveTv'),
        description: t('liveTvSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiNetwork,
        name: t('networking'),
        description: t('networkingSettingsDescription'),
        link: undefined
      }
    ],
    [
      {
        icon: IMdiPuzzle,
        name: t('plugins'),
        description: t('pluginsSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiCalendarClock,
        name: t('scheduledTasks'),
        description: t('scheduledTasksSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiBell,
        name: t('notifications'),
        description: t('notificationsSettingsDescription'),
        link: undefined
      },
      {
        icon: IMdiTextBox,
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

.logo {
  background: rgb(var(--v-theme-card));
  height: 100px;
}
</style>
