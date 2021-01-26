<template>
  <div v-if="$auth.user.Policy.IsAdministrator">
    <v-list nav flat>
      <v-list-item nuxt to="/settings">
        <v-list-item-avatar>
          <v-icon>mdi-chevron-left</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('settings.goBackToUserSettings') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-list
      v-for="(adminSection, index) in adminSections"
      :key="`admin-section-${index}`"
      two-line
      nav
      dense
    >
      <v-divider v-if="index" />
      <v-list-item-group>
        <v-list-item
          v-for="adminItem in adminSection"
          :key="adminItem.name"
          nuxt
          :to="adminItem.link"
          :value="isCurrentLink(adminItem.link)"
          class="pb-0"
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
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      adminSections: [
        [
          {
            icon: 'mdi-home-analytics',
            name: this.$t('settingsSections.admin.overview.name'),
            description: this.$t('settingsSections.admin.overview.description'),
            link: '/settings/admin/overview'
          }
        ],
        [
          {
            icon: 'mdi-cog',
            name: this.$t('settingsSections.admin.general.name'),
            description: this.$t('settingsSections.admin.general.description'),
            link: '/settings/admin/general'
          },
          {
            icon: 'mdi-devices',
            name: this.$t('settingsSections.admin.devices.name'),
            description: this.$t('settingsSections.admin.devices.description'),
            link: undefined
          },
          {
            icon: 'mdi-library-shelves',
            name: this.$t('settingsSections.admin.libraries.name'),
            description: this.$t(
              'settingsSections.admin.libraries.description'
            ),
            link: '/settings/admin/libraries'
          }
        ],
        [
          {
            icon: 'mdi-account-multiple',
            name: this.$t('settingsSections.admin.users.name'),
            description: this.$t('settingsSections.admin.users.description'),
            link: '/settings/admin/users'
          },
          {
            icon: 'mdi-key-chain',
            name: this.$t('settingsSections.admin.apiKeys.name'),
            description: this.$t('settingsSections.admin.apiKeys.description'),
            link: '/settings/admin/apikeys'
          }
        ],
        [
          {
            icon: 'mdi-play-network',
            name: this.$t(
              'settingsSections.admin.transcodingAndStreaming.name'
            ),
            description: this.$t(
              'settingsSections.admin.transcodingAndStreaming.description'
            ),
            link: '/settings/admin/transcoding'
          },
          {
            icon: 'mdi-dlna',
            name: this.$t('settingsSections.admin.dlna.name'),
            description: this.$t('settingsSections.admin.dlna.description'),
            link: '/settings/admin/dlna'
          },
          {
            icon: 'mdi-television-classic',
            name: this.$t('settingsSections.admin.liveTvAndDvr.name'),
            description: this.$t(
              'settingsSections.admin.liveTvAndDvr.description'
            ),
            link: '/settings/admin/livetv'
          },
          {
            icon: 'mdi-network',
            name: this.$t('settingsSections.admin.networking.name'),
            description: this.$t(
              'settingsSections.admin.networking.description'
            ),
            link: '/settings/admin/network'
          }
        ],
        [
          {
            icon: 'mdi-puzzle',
            name: this.$t('settingsSections.admin.plugins.name'),
            description: this.$t('settingsSections.admin.plugins.description'),
            link: '/settings/admin/plugins'
          },
          {
            icon: 'mdi-calendar-clock',
            name: this.$t('settingsSections.admin.scheduledTasks.name'),
            description: this.$t(
              'settingsSections.admin.scheduledTasks.description'
            ),
            link: '/settings/admin/tasks'
          },
          {
            icon: 'mdi-bell',
            name: this.$t('settingsSections.admin.notifications.name'),
            description: this.$t(
              'settingsSections.admin.notifications.description'
            ),
            link: '/settings/admin/notifications'
          },
          {
            icon: 'mdi-text-box',
            name: this.$t('settingsSections.admin.logs.name'),
            description: this.$t('settingsSections.admin.logs.description'),
            link: '/settings/admin/logsAndActivity'
          }
        ]
      ]
    };
  },
  methods: {
    isCurrentLink(link: string): boolean {
      if (link) {
        return this.$route.fullPath.includes(link);
      }
      return false;
    }
  }
});
</script>
