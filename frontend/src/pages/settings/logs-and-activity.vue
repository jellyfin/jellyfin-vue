<template>
  <settings-page page-title="settingsSections.logsAndActivity.logsAndActivity">
    <template #content>
      <v-col md="6" class="pt-0 pb-4">
        <v-fade-transition group>
          <h2 key="logs-title" class="text-h6 mb-2">
            {{ $t('settings.logsAndActivity.logs') }}
          </h2>
          <v-list
            v-if="logFiles && logFiles.length > 0"
            key="log-list"
            lines="two"
            class="mb-2">
            <v-list-group>
              <v-list-item
                v-for="file in logFiles"
                :key="file.Name"
                :href="getLogFileLink(file.Name)"
                target="_blank"
                rel="noopener">
                <v-avatar>
                  <Icon>
                    <i-mdi-file />
                  </Icon>
                </v-avatar>
                <v-list-item-title v-text="file.Name" />
                <v-list-item-subtitle
                  v-text="getFormattedLogDate(file.DateModified)" />
                <v-list-item-action>
                  <Icon>
                    <i-mdi-open-in-new />
                  </Icon>
                </v-list-item-action>
              </v-list-item>
            </v-list-group>
          </v-list>
          <v-card
            v-else-if="loadingLogsStatus.status === 'loaded'"
            key="no-log-card">
            <v-card-title>
              {{ $t('settings.logsAndActivity.noLogsFound') }}
            </v-card-title>
          </v-card>
          <v-card
            v-else-if="loadingLogsStatus.status === 'error'"
            key="error-log-card">
            <v-card-title>
              <Icon color="error" class="pr-2">
                <i-mdi-alert-circle />
              </Icon>
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
            lines="two"
            class="mb-2"
            disabled>
            <v-list-group>
              <v-list-item v-for="activity in activityList" :key="activity.Id">
                <v-avatar :color="getColorFromSeverity(activity.Severity)">
                  <v-icon :icon="getIconFromType(activity.Type)" />
                </v-avatar>
                <v-list-item-title v-text="activity.Name" />
                <v-list-item-subtitle v-text="activity.ShortOverview" />
                <v-list-item-action>
                  <v-list-item-subtitle
                    class="text-capitalize-first-letter"
                    v-text="getFormattedActivityDate(activity.Date)" />
                </v-list-item-action>
              </v-list-item>
            </v-list-group>
          </v-list>
          <v-card
            v-else-if="loadingActivityStatus.status === 'loaded'"
            key="no-activity-card">
            <v-card-title>
              {{ $t('settings.logsAndActivity.noActivityFound') }}
            </v-card-title>
          </v-card>
          <v-card
            v-else-if="loadingActivityStatus.status === 'error'"
            key="error-activity-card">
            <v-card-title>
              <Icon color="error" class="pr-2">
                <i-mdi-alert-circle />
              </Icon>
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

<route lang="yaml">
meta:
  admin: true
</route>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import colors from 'vuetify/lib/util/colors';
import {
  ActivityLogEntry,
  LogFile,
  LogLevel
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import IMdiLogin from '~icons/mdi/login';
import IMdiLogout from '~icons/mdi/logout';
import IMdiLock from '~icons/mdi/lock';
import IMdiPlay from '~icons/mdi/play';
import IMdiStop from '~icons/mdi/stop';
import IMdiHelp from '~icons/mdi/help';

interface LoadingStatus {
  status: 'loading' | 'loaded' | 'error';
  errorMessage: string;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const route = useRoute();

    route.meta.title = t('settingsSections.logs.name');
  },
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
  methods: {
    getColorFromSeverity(severity: LogLevel): string {
      switch (severity) {
        case LogLevel.Trace: {
          return (
            this.$vuetify.theme.currentTheme.success?.toString() ||
            colors.green.base
          );
        }
        case LogLevel.Debug: {
          return (
            this.$vuetify.theme.currentTheme.accent?.toString() ||
            colors.blue.accent1
          );
        }
        case LogLevel.Information: {
          return (
            this.$vuetify.theme.currentTheme.info?.toString() ||
            colors.blue.base
          );
        }
        case LogLevel.Warning: {
          return (
            this.$vuetify.theme.currentTheme.warning?.toString() ||
            colors.amber.base
          );
        }
        case LogLevel.Error: {
          return (
            this.$vuetify.theme.currentTheme.error?.toString() ||
            colors.red.accent2
          );
        }
        case LogLevel.Critical: {
          return (
            this.$vuetify.theme.currentTheme.secondary?.toString() ||
            colors.grey.darken3
          );
        }
        default: {
          return (
            this.$vuetify.theme.currentTheme.primary?.toString() ||
            colors.blue.darken2
          );
        }
      }
    },
    getIconFromType(type: string): typeof IMdiLogin {
      switch (type) {
        case 'SessionStarted': {
          return IMdiLogin;
        }
        case 'SessionEnded': {
          return IMdiLogout;
        }
        case 'UserPasswordChanged': {
          return IMdiLock;
        }
        case 'VideoPlayback': {
          return IMdiPlay;
        }
        case 'VideoPlaybackStopped': {
          return IMdiStop;
        }
        default: {
          return IMdiHelp;
        }
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
      return `${this.$axios.defaults.baseURL}/System/Logs/Log?name=${name}&api_key=${this.$remote.auth.currentUserToken}`;
    }
  }
});
</script>
