<template>
  <settings-page page-title="settingsSections.admin.logs.name">
    <template #content>
      <div
        :class="$vuetify.breakpoint.smAndDown ? 'd-flex flex-wrap' : 'd-flex'"
      >
        <v-card class="card ma-2">
          <v-text-field
            v-model="logSearch"
            :label="$t('settings.logsAndActivity.logs')"
            class="pa-2"
          />
          <v-card-subtitle v-if="!logFiles.length">
            {{ $t('settings.logsAndActivity.noLogsFound') }}
          </v-card-subtitle>
          <v-list-item-group v-else>
            <v-virtual-scroll
              v-if="logFiles.length"
              :items="logListFiltered"
              item-height="50"
              height="500px"
            >
              <template #default="{ item }">
                <v-list-item
                  :key="item.Name"
                  :href="getLogFileLink(item.Name)"
                  target="_blank"
                  rel="noopener"
                >
                  <v-list-item-avatar>
                    <v-icon>mdi-file</v-icon>
                  </v-list-item-avatar>
                  <v-list-item-title class="text-truncate" v-text="item.Name" />
                  <v-list-item-subtitle
                    v-text="getFormattedLogDate(item.DateModified)"
                  />
                  <v-list-item-action>
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
            </v-virtual-scroll>
          </v-list-item-group>
        </v-card>

        <v-card class="card ma-2">
          <v-text-field
            v-model="activitySearch"
            :label="$t('settings.logsAndActivity.activity')"
            class="pa-2"
          />
          <v-card-subtitle v-if="!activityList.length">
            {{ $t('settings.logsAndActivity.noActivityFound') }}
          </v-card-subtitle>
          <v-list-item-group v-else>
            <v-virtual-scroll
              :items="activityListFiltered"
              item-height="70"
              height="500px"
            >
              <template #default="{ item }">
                <v-list-item inactive :ripple="false">
                  <v-list-item-avatar
                    :color="getColorFromSeverity(item.Severity)"
                  >
                    <v-icon dark v-text="getIconFromType(item.Type)" />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-truncate"
                      v-text="item.Name"
                    />
                    <v-list-item-subtitle v-text="item.ShortOverview" />
                    <v-list-item-subtitle
                      class="text-capitalize-first-letter"
                      v-text="getFormattedActivityDate(item.Date)"
                    />
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-virtual-scroll>
          </v-list-item-group>
        </v-card>
      </div>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import colors from 'vuetify/lib/util/colors';
import { ActivityLogEntry, LogFile, LogLevel } from '@jellyfin/client-axios';

export default Vue.extend({
  middleware: 'adminMiddleware',
  async asyncData({ $api }) {
    const activityList = (await $api.activityLog.getLogEntries({ limit: 5000 }))
      .data.Items;
    const logFiles = (await $api.system.getServerLogs()).data;

    return { activityList, logFiles };
  },
  data() {
    return {
      activityList: [] as ActivityLogEntry[],
      logFiles: [] as LogFile[],
      activitySearch: '',
      logSearch: ''
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    activityListFiltered: {
      get(): ActivityLogEntry[] {
        return this.activityList.filter((activity) => {
          return (
            activity.Name?.toLowerCase().includes(
              this.activitySearch.toLowerCase()
            ) ||
            activity.ShortOverview?.toLowerCase().includes(
              this.activitySearch.toLowerCase()
            )
          );
        });
      }
    },
    logListFiltered: {
      get(): LogFile[] {
        return this.logFiles.filter((log) => {
          return log.Name?.toLowerCase().includes(this.logSearch.toLowerCase());
        });
      }
    }
  },
  beforeMount() {
    this.setPageTitle({
      title: this.$t('settingsSections.admin.logs.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    getColorFromSeverity(severity: LogLevel): string {
      switch (severity) {
        case LogLevel.Trace:
          return (
            this.$vuetify.theme.currentTheme.success?.toString() ||
            colors.green.base
          );
        case LogLevel.Debug:
          return (
            this.$vuetify.theme.currentTheme.accent?.toString() ||
            colors.blue.accent1
          );
        case LogLevel.Information:
          return (
            this.$vuetify.theme.currentTheme.info?.toString() ||
            colors.blue.base
          );
        case LogLevel.Warning:
          return (
            this.$vuetify.theme.currentTheme.warning?.toString() ||
            colors.amber.base
          );
        case LogLevel.Error:
          return (
            this.$vuetify.theme.currentTheme.error?.toString() ||
            colors.red.accent2
          );
        case LogLevel.Critical:
          return (
            this.$vuetify.theme.currentTheme.secondary?.toString() ||
            colors.grey.darken3
          );
        default:
          return (
            this.$vuetify.theme.currentTheme.primary?.toString() ||
            colors.blue.darken2
          );
      }
    },
    getIconFromType(type: string): string {
      switch (type) {
        case 'SessionStarted':
          return 'mdi-login';
        case 'SessionEnded':
          return 'mdi-logout';
        case 'UserPasswordChanged':
          return 'mdi-lock';
        case 'VideoPlayback':
          return 'mdi-play';
        case 'VideoPlaybackStopped':
          return 'mdi-stop';
        default:
          return 'mdi-help';
      }
    },
    getFormattedActivityDate(date: string): string {
      return this.$dateFns.formatRelative(Date.parse(date), new Date(), {
        locale: this.$i18n.locale
      });
    },
    getFormattedLogDate(date: string): string {
      return this.$dateFns.format(Date.parse(date), 'Ppp');
    },
    getLogFileLink(name: string): string {
      return `${this.$axios.defaults.baseURL}/System/Logs/Log?name=${name}&api_key=${this.$store.state.user.accessToken}`;
    }
  }
});
</script>

<style lang="scss" scoped>
.card {
  width: 100%;
}
</style>
