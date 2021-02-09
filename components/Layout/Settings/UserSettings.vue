<template>
  <v-list two-line nav dense>
    <v-list-item-group>
      <div class="pa-4">
        <h1 class="text-overline title">
          {{ $t('settings.accountAndClient') }}
        </h1>
      </div>
      <v-list-item
        v-for="userItem in userItems"
        :key="userItem.name"
        nuxt
        exact
        :ripple="!userItem.sync"
        :to="userItem.link"
        :inactive="userItem.sync"
        :value="isCurrentLink(userItem.link)"
        three-line
      >
        <v-list-item-avatar>
          <v-icon v-text="userItem.icon" />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title v-text="userItem.name" />
          <v-list-item-subtitle
            class="align-self-start"
            v-text="userItem.description"
          />
        </v-list-item-content>
        <v-list-item-action>
          <v-icon v-if="!userItem.sync">mdi-chevron-right</v-icon>
          <v-switch v-else v-model="sync" />
        </v-list-item-action>
      </v-list-item>
      <v-spacer />
      <div v-if="$auth.user.Policy.IsAdministrator">
        <div class="pa-4">
          <h1 class="text-overline title">
            {{ $t('settings.serverAndAdmin') }}
          </h1>
        </div>
        <v-list-item
          v-for="adminItem in adminItems"
          :key="adminItem.name"
          nuxt
          :to="adminItem.link"
          three-line
        >
          <v-list-item-avatar>
            <v-icon v-text="adminItem.icon" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-text="adminItem.name" />
            <v-list-item-subtitle
              class="align-self-start"
              v-text="adminItem.description"
            />
          </v-list-item-content>
          <v-list-item-action>
            <v-icon>mdi-chevron-right</v-icon>
          </v-list-item-action>
        </v-list-item>
      </div>
    </v-list-item-group>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      sync: false,
      userItems: [
        {
          icon: 'mdi-account-cog',
          name: this.$t('settingsSections.user.account.name'),
          description: this.$t('settingsSections.user.account.description'),
          link: '/settings/user/account'
        },
        {
          icon: 'mdi-human',
          name: this.$t('settingsSections.user.accessibility.name'),
          description: this.$t(
            'settingsSections.user.accessibility.description'
          ),
          link: '/settings/user/accessibility'
        },
        {
          icon: 'mdi-palette',
          name: this.$t('settingsSections.user.appearance.name'),
          description: this.$t('settingsSections.user.appearance.description'),
          link: '/settings/user/appearance'
        },
        {
          icon: 'mdi-home',
          name: this.$t('settingsSections.user.home.name'),
          description: this.$t('settingsSections.user.home.description'),
          link: '/settings/user/home'
        },
        {
          icon: 'mdi-play-pause',
          name: this.$t('settingsSections.user.playback.name'),
          description: this.$t('settingsSections.user.playback.description'),
          link: '/settings/user/playback'
        },
        {
          icon: 'mdi-disc-player',
          name: this.$t('settingsSections.user.mediaPlayers.name'),
          description: this.$t(
            'settingsSections.user.mediaPlayers.description'
          ),
          link: '/settings/user/players'
        },
        {
          icon: 'mdi-subtitles',
          name: this.$t('settingsSections.user.subtitles.name'),
          description: this.$t('settingsSections.user.subtitles.description'),
          link: '/settings/user/subtitles'
        },
        {
          icon: 'mdi-sync',
          name: this.$t('settings.settingSyncing'),
          description: this.$t('settings.settingSyncingDescription'),
          link: null,
          sync: true
        }
      ],
      adminItems: [
        {
          icon: 'mdi-server',
          name: this.$t('settingsSections.user.server.name'),
          description: this.$t('settingsSections.user.server.description'),
          link: '/settings/admin'
        }
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

<style lang="scss" scoped>
.title {
  font-size: 1em !important;
}
</style>
