<template>
  <settings-page>
    <template #content>
      <v-col md="6" class="pt-0 pb-4">
        <v-fade-transition group>
          <h2 key="logs-title" class="text-h6 mb-2">
            {{ $t('settings.logsAndActivity.logs') }}
          </h2>
          <v-list
            v-if="logFiles && logFiles.length > 0"
            key="log-list"
            two-line
            class="mb-2"
          >
            <v-list-item-group>
              <v-list-item
                v-for="file in logFiles"
                :key="file.Name"
                :href="getLogFileLink(file.Name)"
                target="_blank"
                rel="noopener"
              >
                <v-list-item-avatar>
                  <v-icon>mdi-file</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-text="file.Name" />
                  <v-list-item-subtitle
                    v-text="getFormattedLogDate(file.DateModified)"
                  />
                </v-list-item-content>
                <v-list-item-action>
                  <v-icon>mdi-open-in-new</v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
          <v-card
            v-else-if="loadingLogsStatus.status === 'loaded'"
            key="no-log-card"
          >
            <v-card-title>
              {{ $t('settings.logsAndActivity.noLogsFound') }}
            </v-card-title>
          </v-card>
          <v-card
            v-else-if="loadingLogsStatus.status === 'error'"
            key="error-log-card"
          >
            <v-card-title>
              <v-icon color="error" class="pr-2">mdi-alert-circle</v-icon>
              {{ $t('settings.logsAndActivity.failedGetLogs') }}
            </v-card-title>
            <v-card-text v-if="loadingLogsStatus.errorMessage">
              {{ loadingLogsStatus.errorMessage }}
            </v-card-text>
          </v-card>
        </v-fade-transition>
      </v-col>
      <v-col md="6" class="pt-0 pb-4">
        <v-fade-transition group>
          <h2 key="activity-title" class="text-h6 mb-2">
            {{ $t('settings.logsAndActivity.activity') }}
          </h2>
          <v-list
            v-if="activityList && activityList.length > 0"
            key="activity-list"
            two-line
            class="mb-2"
            disabled
          >
            <v-list-item-group>
              <v-list-item v-for="activity in activityList" :key="activity.Id">
                <v-list-item-avatar
                  :color="getColorFromSeverity(activity.Severity)"
                >
                  <v-icon dark v-text="getIconFromType(activity.Type)" />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-text="activity.Name" />
                  <v-list-item-subtitle v-text="activity.ShortOverview" />
                </v-list-item-content>
                <v-list-item-action>
                  <v-list-item-subtitle
                    class="text-capitalize-first-letter"
                    v-text="getFormattedActivityDate(activity.Date)"
                  />
                </v-list-item-action>
              </v-list-item>
            </v-list-item-group>
          </v-list>
          <v-card
            v-else-if="loadingActivityStatus.status === 'loaded'"
            key="no-activity-card"
          >
            <v-card-title>
              {{ $t('settings.logsAndActivity.noActivityFound') }}
            </v-card-title>
          </v-card>
          <v-card
            v-else-if="loadingActivityStatus.status === 'error'"
            key="error-activity-card"
          >
            <v-card-title>
              <v-icon color="error" class="pr-2">mdi-alert-circle</v-icon>
              {{ $t('settings.logsAndActivity.failedGetActivity') }}
            </v-card-title>
            <v-card-text v-if="loadingActivityStatus.errorMessage">
              {{ loadingActivityStatus.errorMessage }}
            </v-card-text>
          </v-card>
        </v-fade-transition>
      </v-col>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import colors from 'vuetify/lib/util/colors';
import { ActivityLogEntry, LogFile, LogLevel } from '@jellyfin/client-axios';

interface LoadingStatus {
  status: 'loading' | 'loaded' | 'error';
  errorMessage: string;
}

export default Vue.extend({
  middleware: 'adminMiddleware',
  async asyncData({ $api }) {
    const minDate = new Date();

    minDate.setDate(minDate.getDate() - 7);

    const activityList = (
      await $api.activityLog.getLogEntries({ minDate: minDate.toISOString() })
    ).data.Items;
    const logFiles = (await $api.system.getServerLogs()).data;

    return { activityList, logFiles };
  },
  data() {
    return {
      activityList: [] as ActivityLogEntry[],
      logFiles: [] as LogFile[],
      loadingLogsStatus: { status: 'error' } as LoadingStatus,
      loadingActivityStatus: { status: 'error' } as LoadingStatus
    };
  },
  head() {
    return {
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title']),
    ...mapState('user', ['accessToken'])
  },
  activated() {
    this.setPageTitle({ title: this.$t('settingsSections.logs.name') });
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
    getFormattedActivityDate(date: Date): string {
      return this.$dateFns.formatRelative(
        this.$dateFns.parseJSON(date),
        new Date()
      );
    },
    getFormattedLogDate(date: Date): string {
      return this.$dateFns.format(date, 'Ppp');
    },
    getLogFileLink(name: string): string {
      return `${this.$axios.defaults.baseURL}/System/Logs/Log?name=${name}&api_key=${this.accessToken}`;
    }
  }
});
</script>
