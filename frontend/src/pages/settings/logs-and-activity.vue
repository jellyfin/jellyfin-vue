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
                  <v-icon>
                    <i-mdi-file />
                  </v-icon>
                </v-avatar>
                <v-list-item-title>
                  {{ file.Name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ getFormattedLogDate(file.DateModified) }}
                </v-list-item-subtitle>
                <v-list-item-action>
                  <v-icon>
                    <i-mdi-open-in-new />
                  </v-icon>
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
              <v-icon color="error" class="pr-2">
                <i-mdi-alert-circle />
              </v-icon>
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
                <v-list-item-title>
                  {{ activity.Name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ activity.ShortOverview }}
                </v-list-item-subtitle>
                <v-list-item-action>
                  <v-list-item-subtitle class="text-capitalize-first-letter">
                    {{ getFormattedActivityDate(activity.Date) }}
                  </v-list-item-subtitle>
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
              <v-icon color="error" class="pr-2">
                <i-mdi-alert-circle />
              </v-icon>
              {{ $t('settings.logsAndActivity.failedGetActivity') }}
            </v-card-title>
            <v-card-text>
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
import { defineComponent } from 'vue';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { format, formatRelative, parseJSON } from 'date-fns';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import IMdiLogin from 'virtual:icons/mdi/login';
import IMdiLogout from 'virtual:icons/mdi/logout';
import IMdiLock from 'virtual:icons/mdi/lock';
import IMdiPlay from 'virtual:icons/mdi/play';
import IMdiStop from 'virtual:icons/mdi/stop';
import IMdiHelp from 'virtual:icons/mdi/help';
import { useDateFns, useRemote } from '@/composables';

interface LoadingStatus {
  status: 'loading' | 'loaded' | 'error';
  errorMessage?: string;
}

export default defineComponent({
  async setup() {
    const { t } = useI18n();
    const route = useRoute();
    const remote = useRemote();

    route.meta.title = t('settingsSections.logs.name');

    const minDate = new Date();

    minDate.setDate(minDate.getDate() - 7);

    const activityList = (
      await remote.sdk
        .newUserApi(getActivityLogApi)
        .getLogEntries({ minDate: minDate.toISOString() })
    ).data.Items;
    const logFiles = (await remote.sdk.newUserApi(getSystemApi).getServerLogs())
      .data;

    return { activityList, logFiles };
  },
  data() {
    return {
      loadingLogsStatus: { status: 'error' } as LoadingStatus,
      loadingActivityStatus: { status: 'error' } as LoadingStatus
    };
  },
  methods: {
    getColorFromSeverity(severity: LogLevel | undefined): string {
      switch (severity) {
        case LogLevel.Trace: {
          return this.$vuetify.theme.current.colors.success;
        }
        case LogLevel.Debug: {
          return this.$vuetify.theme.current.colors.accent;
        }
        case LogLevel.Information: {
          return this.$vuetify.theme.current.colors.info;
        }
        case LogLevel.Warning: {
          return this.$vuetify.theme.current.colors.warning;
        }
        case LogLevel.Error: {
          return this.$vuetify.theme.current.colors.error;
        }
        case LogLevel.Critical: {
          return this.$vuetify.theme.current.colors.secondary;
        }
        default: {
          return this.$vuetify.theme.current.colors.primary;
        }
      }
    },
    getIconFromType(type: string | undefined | null): typeof IMdiLogin {
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
    getFormattedActivityDate(date: string | undefined): string {
      return date
        ? useDateFns(formatRelative, parseJSON(date), new Date()).value
        : '';
    },
    getFormattedLogDate(date: string | undefined): string {
      return date ? useDateFns(format, parseJSON(date), 'Ppp').value : '';
    },
    getLogFileLink(name: string): string {
      return `${this.$remote.sdk.api?.basePath}/System/Logs/Log?name=${name}&api_key=${this.$remote.auth.currentUserToken}`;
    }
  }
});
</script>
