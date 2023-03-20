<template>
  <v-container>
    <v-row class="pt-4">
      <v-col cols="12" offset-lg="1" md="5" lg="4" class="py-4">
        <div
          v-if="
            !isEmpty(systemInfo) &&
            $remote.auth.currentUser?.Policy?.IsAdministrator
          ">
          <v-img class="logo" src="/icon.png" :alt="$t('jellyfinLogo')" />
          <v-table class="mb-4 pb-2 information">
            <tbody>
              <tr>
                <td>{{ $t('server') }}</td>
                <td>{{ systemInfo.ServerName }}</td>
              </tr>
              <tr>
                <td>{{ $t('serverVersion') }}</td>
                <td>{{ systemInfo.Version }}</td>
              </tr>
              <tr>
                <td>{{ $t('operatingSystem') }}</td>
                <td>{{ systemInfo.OperatingSystemDisplayName }}</td>
              </tr>
              <tr>
                <td>{{ $t('architecture') }}</td>
                <td>{{ systemInfo.SystemArchitecture }}</td>
              </tr>
              <tr>
                <td>{{ $t('vueClientVersion') }}</td>
                <td>{{ clientVersion }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <about-links v-if="!$vuetify.display.mobile" />
      </v-col>
      <v-col cols="12" md="6" lg="5" class="py-4">
        <!-- User settings -->
        <v-list lines="two" class="mb-4 overflow-y-hidden">
          <v-item-group>
            <v-list-item
              v-for="userItem in userItems"
              :key="userItem.name"
              :to="userItem.link"
              :disabled="!userItem.link">
              <template #prepend>
                <v-avatar>
                  <v-icon :icon="userItem.icon" />
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ userItem.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ userItem.description }}
              </v-list-item-subtitle>
              <template #append>
                <v-list-item-action>
                  <v-icon>
                    <i-mdi-chevron-right />
                  </v-icon>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-item-group>
        </v-list>
        <!-- Administrator settings -->
        <div v-if="$remote.auth.currentUser?.Policy?.IsAdministrator">
          <v-list
            v-for="(adminSection, index) in adminSections"
            :key="`admin-section-${index}`"
            class="mb-4 overflow-y-hidden">
            <v-item-group>
              <v-list-item
                v-for="adminItem in adminSection"
                :key="adminItem.name"
                :to="adminItem.link"
                :disabled="!adminItem.link">
                <template #prepend>
                  <v-avatar>
                    <v-icon :icon="adminItem.icon" />
                  </v-avatar>
                </template>
                <v-list-item-title>
                  {{ adminItem.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ adminItem.description }}
                </v-list-item-subtitle>
                <template #append>
                  <v-list-item-action>
                    <v-icon>
                      <i-mdi-chevron-right />
                    </v-icon>
                  </v-list-item-action>
                </template>
              </v-list-item>
            </v-item-group>
          </v-list>
        </div>
        <about-links v-if="$vuetify.display.mobile" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash-es';
import { SystemInfo } from '@jellyfin/sdk/lib/generated-client';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import IMdiAccount from 'virtual:icons/mdi/account';
import IMdiHome from 'virtual:icons/mdi/home';
import IMdiPlayPause from 'virtual:icons/mdi/play-pause';
import IMdiDiscPlayer from 'virtual:icons/mdi/disc-player';
import IMdiSubtitles from 'virtual:icons/mdi/subtitles';
import IMdiServer from 'virtual:icons/mdi/server';
import IMdiDevices from 'virtual:icons/mdi/devices';
import IMdiLibraryShelves from 'virtual:icons/mdi/library-shelves';
import IMdiAccountMultiple from 'virtual:icons/mdi/account-multiple';
import IMdiKeyChain from 'virtual:icons/mdi/key-chain';
import IMdiPlayNetwork from 'virtual:icons/mdi/play-network';
import IMdiDLNA from 'virtual:icons/mdi/dlna';
import IMdiTelevisionClassic from 'virtual:icons/mdi/television-classic';
import IMdiNetwork from 'virtual:icons/mdi/network';
import IMdiPuzzle from 'virtual:icons/mdi/puzzle';
import IMdiCalendarClock from 'virtual:icons/mdi/calendar-clock';
import IMdiBell from 'virtual:icons/mdi/bell';
import IMdiTextBox from 'virtual:icons/mdi/text-box';
import { useRemote } from '@/composables';
import { version as clientVersion } from '@/../package.json';

const { t } = useI18n();
const route = useRoute();
const remote = useRemote();

route.meta.title = t('settings.settings');

let systemInfo: SystemInfo = {};

if (remote.auth.currentUser?.Policy?.IsAdministrator) {
  systemInfo = (await remote.sdk.newUserApi(getSystemApi).getSystemInfo()).data;
}

const userItems = computed(() => {
  return [
    {
      icon: IMdiAccount,
      name: t('settingsSections.account.name'),
      description: t('settingsSections.account.description'),
      link: undefined
    },
    {
      icon: IMdiHome,
      name: t('settingsSections.home.name'),
      description: t('settingsSections.home.description'),
      link: undefined
    },
    {
      icon: IMdiPlayPause,
      name: t('settingsSections.playback.name'),
      description: t('settingsSections.playback.description'),
      link: undefined
    },
    {
      icon: IMdiDiscPlayer,
      name: t('settingsSections.mediaPlayers.name'),
      description: t('settingsSections.mediaPlayers.description'),
      link: undefined
    },
    {
      icon: IMdiSubtitles,
      name: t('settingsSections.subtitles.name'),
      description: t('settingsSections.subtitles.description'),
      link: undefined
    }
  ];
});

const adminSections = computed(() => {
  return [
    [
      {
        icon: IMdiServer,
        name: t('settingsSections.server.name'),
        description: t('settingsSections.server.description'),
        link: undefined
      },
      {
        icon: IMdiDevices,
        name: t('settingsSections.devices.name'),
        description: t('settingsSections.devices.description'),
        link: 'settings/devices'
      },
      {
        icon: IMdiLibraryShelves,
        name: t('settingsSections.libraries.name'),
        description: t('settingsSections.libraries.description'),
        link: undefined
      }
    ],
    [
      {
        icon: IMdiAccountMultiple,
        name: t('settingsSections.users.name'),
        description: t('settingsSections.users.description'),
        link: undefined
      },
      {
        icon: IMdiKeyChain,
        name: t('settings.apiKeys.apiKeys'),
        description: t('settings.apiKeys.description'),
        link: '/settings/apikeys'
      }
    ],
    [
      {
        icon: IMdiPlayNetwork,
        name: t('settingsSections.transcodingAndStreaming.name'),
        description: t('settingsSections.transcodingAndStreaming.description'),
        link: undefined
      },
      {
        icon: IMdiDLNA,
        name: t('settingsSections.dlna.name'),
        description: t('settingsSections.dlna.description'),
        link: undefined
      },
      {
        icon: IMdiTelevisionClassic,
        name: t('settingsSections.liveTvAndDvr.name'),
        description: t('settingsSections.liveTvAndDvr.description'),
        link: undefined
      },
      {
        icon: IMdiNetwork,
        name: t('settingsSections.networking.name'),
        description: t('settingsSections.networking.description'),
        link: undefined
      }
    ],
    [
      {
        icon: IMdiPuzzle,
        name: t('settingsSections.plugins.name'),
        description: t('settingsSections.plugins.description'),
        link: undefined
      },
      {
        icon: IMdiCalendarClock,
        name: t('settingsSections.scheduledTasks.name'),
        description: t('settingsSections.scheduledTasks.description'),
        link: undefined
      },
      {
        icon: IMdiBell,
        name: t('settingsSections.notifications.name'),
        description: t('settingsSections.notifications.description'),
        link: undefined
      },
      {
        icon: IMdiTextBox,
        name: t('settingsSections.logs.name'),
        description: t('settingsSections.logs.description'),
        link: 'settings/logs-and-activity'
      }
    ]
  ];
});
</script>

<style lang="scss" scoped>
.information td {
  height: 3.4em !important;
  border-bottom: 0 !important;
}

.logo {
  background: rgb(var(--v-theme-card));
  height: 100px;
}
</style>
