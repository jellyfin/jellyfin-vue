<template>
  <v-container>
    <v-row>
      <v-col cols="12" offset-md="1" md="4" class="pt-0 pb-4">
        <v-card
          v-if="!isEmpty(systemInfo) && $auth.user.Policy.IsAdministrator"
          :class="{ 'mb-4': !$vuetify.breakpoint.mobile }"
        >
          <v-card-text>
            <v-row>
              <v-col>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>Server</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.ServerName }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>Version</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.Version }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>Operating system</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.OperatingSystemDisplayName }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>Architecture</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.SystemArchitecture }}</span>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="3" class="d-flex justify-end">
                <v-avatar tile size="96" color="grey">
                  <v-icon>mdi-server</v-icon>
                </v-avatar>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card v-if="!$vuetify.breakpoint.mobile">
          <v-card-text>
            <v-row>
              <v-col>
                <p class="mb-0">
                  This server is powered by
                  <a href="https://jellyfin.org/">Jellyfin</a>
                  <br />
                  Read the
                  <a href="https://jellyfin.org/docs/">documentation</a>
                  <br />
                  Help
                  <a href="https://translate.jellyfin.org"
                    >translate Jellyfin</a
                  >
                  in your language
                  <br />
                  <a href="https://github.com/jellyfin/jellyfin-vue/issues/new">
                    Report an issue
                  </a>
                  with the Vue client
                </p>
              </v-col>
              <v-col cols="3" class="d-flex justify-end">
                <img src="~/static/icon.png" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        :offset-md="isEmpty(systemInfo) ? 5 : 0"
        md="5"
        class="pt-0 pb-4"
      >
        <!-- User settings -->
        <v-list two-line class="mb-4">
          <v-list-item-group>
            <v-list-item v-for="userItem in userItems" :key="userItem.name">
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
        <v-list v-if="$auth.user.Policy.IsAdministrator" two-line class="mb-4">
          <v-list-item-group>
            <v-list-item v-for="adminItem in adminItems" :key="adminItem.name">
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
        <!-- Mobile links -->
        <v-list v-if="$vuetify.breakpoint.mobile">
          <v-list-item-group>
            <v-list-item
              v-for="linkItem in linkItems"
              :key="linkItem.name"
              :href="linkItem.link"
            >
              <v-list-item-avatar>
                <v-icon v-text="linkItem.icon" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="linkItem.name" />
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-chevron-right</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { isEmpty } from 'lodash';
import Vue from 'vue';
import { mapActions } from 'vuex';
import { SystemInfo } from '~/api';

export default Vue.extend({
  data() {
    return {
      systemInfo: {} as SystemInfo,
      userItems: [
        {
          icon: 'mdi-account',
          name: 'Account',
          description: "Edit your user's information"
        },
        {
          icon: 'mdi-home',
          name: 'Home screen',
          description: 'Configure your home sections and home screen layout'
        },
        {
          icon: 'mdi-play-pause',
          name: 'Playback',
          description: 'Edit your playback preferences for this device'
        },
        {
          icon: 'mdi-disc-player',
          name: 'Media players',
          description: 'Configure how the media players behave for this device'
        },
        {
          icon: 'mdi-subtitles',
          name: 'Subtitles',
          description: 'Control how subtitles are displayed on this device'
        }
      ],
      adminItems: [
        {
          icon: 'mdi-server',
          name: 'Server',
          description: "Configure your server's language and branding"
        },
        {
          icon: 'mdi-devices',
          name: 'Devices',
          description: 'See and manage the devices connected to your server'
        },
        {
          icon: 'mdi-account-multiple',
          name: 'Users',
          description: 'Manage your users and their permissions'
        },
        {
          icon: 'mdi-library-shelves',
          name: 'Libraries',
          description: 'Manage your libraries and their metadata'
        },
        {
          icon: 'mdi-play-network',
          name: 'Transcoding & streaming',
          description:
            'Manage how your server handles transcoding and streaming to clients'
        },
        {
          icon: 'mdi-dlna',
          name: 'DLNA',
          description: 'Configure DLNA settings and profiles'
        },
        {
          icon: 'mdi-television-classic',
          name: 'Live TV & DVR',
          description:
            'Manage your TV tuners, guide data providers and DVR settings'
        },
        {
          icon: 'mdi-network',
          name: 'Networking',
          description: 'Manage the network settings of your server'
        },
        {
          icon: 'mdi-puzzle',
          name: 'Plugins',
          description: 'Add and configure new features for your server'
        },
        {
          icon: 'mdi-key-chain',
          name: 'API keys',
          description:
            'Add and revoke API keys for external access to your server'
        },
        {
          icon: 'mdi-calendar-clock',
          name: 'Scheduled tasks',
          description: 'Manage scheduled tasks running on your server'
        },
        {
          icon: 'mdi-bell',
          name: 'Notifications',
          description: 'Manage and configure notification sent by your server'
        },
        {
          icon: 'mdi-text-box',
          name: 'Logs',
          description: 'Read and search server logs'
        }
      ],
      linkItems: [
        {
          icon: 'mdi-rocket-launch',
          name: 'This server is powered by Jellyfin',
          link: 'https://jellyfin.org/'
        },
        {
          icon: 'mdi-book',
          name: 'Read the documentation',
          link: 'https://jellyfin.org/docs/'
        },
        {
          icon: 'mdi-translate',
          name: 'Help translate Jellyfin in your language',
          link: 'https://translate.jellyfin.org'
        },
        {
          icon: 'mdi-bug',
          name: 'Report an issue with the Vue client',
          link: 'https://github.com/jellyfin/jellyfin-vue/issues/new'
        }
      ]
    };
  },
  async beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.setPageTitle({ title: this.$t('settings') });

    if (this.$auth.user.Policy.IsAdministrator) {
      this.systemInfo = (await this.$api.system.getSystemInfo()).data;
    }
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    isEmpty(object: any): boolean {
      return isEmpty(object);
    }
  }
});
</script>
