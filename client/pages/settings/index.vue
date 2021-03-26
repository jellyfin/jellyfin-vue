<template>
  <v-container>
    <v-row class="pt-4">
      <v-col cols="12" offset-lg="1" md="5" lg="4" class="py-4">
        <v-card
          v-if="!isEmpty(systemInfo) && $auth.user.Policy.IsAdministrator"
          :class="{ 'mb-4': !$vuetify.breakpoint.mobile }"
        >
          <v-card-text class="py-0">
            <v-row>
              <v-col>
                <v-row class="my-0">
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('server') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.ServerName }}</span>
                  </v-col>
                </v-row>
                <v-row class="my-0">
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('serverVersion') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.Version }}</span>
                  </v-col>
                </v-row>
                <v-row class="my-0">
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('operatingSystem') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.OperatingSystemDisplayName }}</span>
                  </v-col>
                </v-row>
                <v-row class="my-0">
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('architecture') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.SystemArchitecture }}</span>
                  </v-col>
                </v-row>
                <v-row class="my-0">
                  <v-col cols="5" class="py-0">
                    <span>{{ $t('vueClientVersion') }}</span>
                  </v-col>
                  <v-col class="py-0">
                    <span>{{ vueVersion }}</span>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="3" class="d-flex justify-end">
                <v-img
                  contain
                  src="/icon.png"
                  width="100%"
                  :alt="$t('jellyfinLogo')"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <about-links v-if="!$vuetify.breakpoint.mobile" />
      </v-col>
      <v-col cols="12" md="6" lg="5" class="pt-0 pb-4">
        <!-- User settings -->
        <v-list two-line class="mb-4">
          <v-list-item-group>
            <v-list-item
              v-for="userItem in userItems"
              :key="userItem.name"
              nuxt
              :to="userItem.link"
              :disabled="!userItem.link"
            >
              <v-list-item-avatar>
                <v-icon v-text="userItem.icon" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="userItem.name" />
                <v-list-item-subtitle v-text="userItem.description" />
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-chevron-right</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
        <!-- Administrator settings -->
        <div v-if="$auth.user.Policy.IsAdministrator">
          <v-list
            v-for="(adminSection, index) in adminSections"
            :key="`admin-section-${index}`"
            two-line
            class="mb-4"
          >
            <v-list-item-group>
              <v-list-item
                v-for="adminItem in adminSection"
                :key="adminItem.name"
                nuxt
                :to="adminItem.link"
                :disabled="!adminItem.link"
              >
                <v-list-item-avatar>
                  <v-icon v-text="adminItem.icon" />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-text="adminItem.name" />
                  <v-list-item-subtitle v-text="adminItem.description" />
                </v-list-item-content>
                <v-list-item-action>
                  <v-icon>mdi-chevron-right</v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </div>
        <about-links v-if="$vuetify.breakpoint.mobile" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import { SystemInfo } from '@jellyfin/client-axios';
import { version } from '../../../package.json';
import htmlHelper from '~/mixins/htmlHelper';

export default Vue.extend({
  mixins: [htmlHelper],
  async asyncData({ $auth, $api }) {
    if ($auth.user?.Policy?.IsAdministrator) {
      const systemInfo = (await $api.system.getSystemInfo()).data;

      return { systemInfo };
    }
  },
  data() {
    return {
      systemInfo: {} as SystemInfo,
      vueVersion: version,
      userItems: [
        {
          icon: 'mdi-account',
          name: this.$t('settingsSections.account.name'),
          description: this.$t('settingsSections.account.description')
        },
        {
          icon: 'mdi-home',
          name: this.$t('settingsSections.home.name'),
          description: this.$t('settingsSections.home.description')
        },
        {
          icon: 'mdi-play-pause',
          name: this.$t('settingsSections.playback.name'),
          description: this.$t('settingsSections.playback.description')
        },
        {
          icon: 'mdi-disc-player',
          name: this.$t('settingsSections.mediaPlayers.name'),
          description: this.$t('settingsSections.mediaPlayers.description')
        },
        {
          icon: 'mdi-subtitles',
          name: this.$t('settingsSections.subtitles.name'),
          description: this.$t('settingsSections.subtitles.description')
        }
      ],
      adminSections: [
        [
          {
            icon: 'mdi-server',
            name: this.$t('settingsSections.server.name'),
            description: this.$t('settingsSections.server.description')
          },
          {
            icon: 'mdi-devices',
            name: this.$t('settingsSections.devices.name'),
            description: this.$t('settingsSections.devices.description'),
            link: 'settings/devices'
          },
          {
            icon: 'mdi-library-shelves',
            name: this.$t('settingsSections.libraries.name'),
            description: this.$t('settingsSections.libraries.description')
          }
        ],
        [
          {
            icon: 'mdi-account-multiple',
            name: this.$t('settingsSections.users.name'),
            description: this.$t('settingsSections.users.description')
          },
          {
            icon: 'mdi-key-chain',
            name: this.$t('settings.apiKeys.apiKeys'),
            description: this.$t('settings.apiKeys.description'),
            link: '/settings/apikeys'
          }
        ],
        [
          {
            icon: 'mdi-play-network',
            name: this.$t('settingsSections.transcodingAndStreaming.name'),
            description: this.$t(
              'settingsSections.transcodingAndStreaming.description'
            )
          },
          {
            icon: 'mdi-dlna',
            name: this.$t('settingsSections.dlna.name'),
            description: this.$t('settingsSections.dlna.description')
          },
          {
            icon: 'mdi-television-classic',
            name: this.$t('settingsSections.liveTvAndDvr.name'),
            description: this.$t('settingsSections.liveTvAndDvr.description')
          },
          {
            icon: 'mdi-network',
            name: this.$t('settingsSections.networking.name'),
            description: this.$t('settingsSections.networking.description')
          }
        ],
        [
          {
            icon: 'mdi-puzzle',
            name: this.$t('settingsSections.plugins.name'),
            description: this.$t('settingsSections.plugins.description')
          },
          {
            icon: 'mdi-calendar-clock',
            name: this.$t('settingsSections.scheduledTasks.name'),
            description: this.$t('settingsSections.scheduledTasks.description')
          },
          {
            icon: 'mdi-bell',
            name: this.$t('settingsSections.notifications.name'),
            description: this.$t('settingsSections.notifications.description')
          },
          {
            icon: 'mdi-text-box',
            name: this.$t('settingsSections.logs.name'),
            description: this.$t('settingsSections.logs.description'),
            link: 'settings/logsAndActivity'
          }
        ]
      ]
    };
  },
  activated() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.setPageTitle({ title: this.$t('settings.settings') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    isEmpty(object: never): boolean {
      return isEmpty(object);
    }
  }
});
</script>
