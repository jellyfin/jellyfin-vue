<template>
  <v-container>
    <v-row>
      <v-col cols="12" offset-lg="1" md="5" lg="4" class="pt-0 pb-4">
        <v-card
          v-if="!isEmpty(systemInfo) && $auth.user.Policy.IsAdministrator"
          :class="{ 'mb-4': !$vuetify.breakpoint.mobile }"
        >
          <v-card-text>
            <v-row>
              <v-col>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('server') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.ServerName }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('version') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.Version }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('operatingSystem') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.OperatingSystemDisplayName }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="pt-0 pb-0">
                    <span>{{ $t('architecture') }}</span>
                  </v-col>
                  <v-col class="pt-0 pb-0">
                    <span>{{ systemInfo.SystemArchitecture }}</span>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="5" class="py-0">
                    <span>{{ $t('vueClientVersion') }}</span>
                  </v-col>
                  <v-col class="py-0">
                    <span>{{ vueVersion }}</span>
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
                  <span
                    v-html="
                      sanitizeHtml(
                        $t('links.poweredByJellyfinLink', {
                          link: linkItems[0].link
                        })
                      )
                    "
                  />
                  <br />
                  <span
                    v-html="
                      sanitizeHtml(
                        $t('links.readTheDocumentationLink', {
                          link: linkItems[1].link
                        })
                      )
                    "
                  />
                  <br />
                  <span
                    v-html="
                      sanitizeHtml(
                        $t('links.helpTranslateLink', {
                          link: linkItems[1].link
                        })
                      )
                    "
                  />
                  <br />
                  <span
                    v-html="
                      sanitizeHtml(
                        $t('links.reportAnIssueLink', {
                          link: linkItems[2].link
                        })
                      )
                    "
                  />
                </p>
              </v-col>
              <v-col cols="3" class="d-flex justify-end">
                <v-img src="/icon.png" width="100%" :alt="$t('jellyfinLogo')" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="5" class="pt-0 pb-4">
        <!-- User settings -->
        <v-list two-line class="mb-4">
          <v-list-item-group>
            <v-list-item
              v-for="userItem in userItems"
              :key="userItem.name"
              disabled
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
        <v-list
          v-if="$auth.user.Policy.IsAdministrator"
          two-line
          class="mb-4"
          disabled
        >
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
              target="_blank"
            >
              <v-list-item-avatar>
                <v-icon v-text="linkItem.icon" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="linkItem.name" />
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-open-in-new</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { isEmpty } from 'lodash';
import { SystemInfo } from '@jellyfin/client-axios';
import { version } from '~/package.json';
import htmlHelper from '~/mixins/htmlHelper';

export default Vue.extend({
  mixins: [htmlHelper],
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
      adminItems: [
        {
          icon: 'mdi-server',
          name: this.$t('settingsSections.server.name'),
          description: this.$t('settingsSections.server.description')
        },
        {
          icon: 'mdi-devices',
          name: this.$t('settingsSections.devices.name'),
          description: this.$t('settingsSections.devices.description')
        },
        {
          icon: 'mdi-account-multiple',
          name: this.$t('settingsSections.users.name'),
          description: this.$t('settingsSections.users.description')
        },
        {
          icon: 'mdi-library-shelves',
          name: this.$t('settingsSections.libraries.name'),
          description: this.$t('settingsSections.libraries.description')
        },
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
        },
        {
          icon: 'mdi-puzzle',
          name: this.$t('settingsSections.plugins.name'),
          description: this.$t('settingsSections.plugins.description')
        },
        {
          icon: 'mdi-key-chain',
          name: this.$t('settingsSections.apiKeys.name'),
          description: this.$t('settingsSections.apiKeys.description')
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
          description: this.$t('settingsSections.logs.description')
        }
      ],
      linkItems: [
        {
          icon: 'mdi-rocket-launch',
          name: this.$t('links.poweredByJellyfin'),
          link: 'https://jellyfin.org'
        },
        {
          icon: 'mdi-book',
          name: this.$t('links.readTheDocumentation'),
          link: 'https://docs.jellyfin.org'
        },
        {
          icon: 'mdi-translate',
          name: this.$t('links.helpTranslate'),
          link: 'https://translate.jellyfin.org'
        },
        {
          icon: 'mdi-bug',
          name: this.$t('links.reportAnIssue'),
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
