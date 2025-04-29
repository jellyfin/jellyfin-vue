<template>
  <SettingsPage>
    <template #title>
      {{ t('logsAndActivity') }}
    </template>
    <template #content>
      <VCol
        md="6"
        class="pt-0 pb-4">
        <JTransition group>
          <h2
            key="logs-title"
            class="text-h6 mb-2">
            {{ t('logs') }}
          </h2>
          <VList
            v-if="logs.length"
            key="log-list"
            lines="two"
            class="mb-2">
            <VListItem
              v-for="file in logs"
              :key="file.Name ?? undefined"
              :href="getLogFileLink(file.Name ?? '')"
              :title="file.Name ?? undefined"
              :subtitle="getFormattedLogDate(file.DateModified)"
              target="_blank"
              rel="noopener">
              <template #prepend>
                <VAvatar>
                  <JIcon class="i-mdi:file" />
                </VAvatar>
              </template>
              <template #append>
                <JIcon class="*i-mdi:open-in-new" />
              </template>
            </VListItem>
          </VList>
          <VCard v-else>
            <VCardTitle>
              {{ t('noLogsFound') }}
            </VCardTitle>
          </VCard>
        </JTransition>
      </VCol>
      <VCol
        md="6"
        class="pt-0 pb-4">
        <JTransition group>
          <h2
            key="activity-title"
            class="text-h6 mb-2">
            {{ t('activity') }}
          </h2>
          <VList
            v-if="activityList.length"
            key="activity-list"
            lines="two"
            class="mb-2">
            <VListItem
              v-for="activity in activityList"
              :key="activity.Id"
              :title="activity.Name"
              :subtitle="activity.ShortOverview ?? undefined">
              <template #prepend>
                <VAvatar :color="getColorFromSeverity(activity.Severity)">
                  <JIcon :class="getIconFromActivityType(activity.Type)" />
                </VAvatar>
              </template>
              <template #append>
                <VListItemSubtitle class="text-capitalize-first-letter">
                  {{ getFormattedActivityDate(activity.Date) }}
                </VListItemSubtitle>
              </template>
            </VListItem>
          </VList>
          <VCard v-else>
            <VCardTitle>
              {{ t('noActivityFound') }}
            </VCardTitle>
          </VCard>
        </JTransition>
      </VCol>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import {
  LogLevel
} from '@jellyfin/sdk/lib/generated-client';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { format, formatRelative, parseJSON } from 'date-fns';
import { useTranslation } from 'i18next-vue';
import { useTheme } from 'vuetify';
import { remote } from '#/plugins/remote';
import { useDateFns } from '#/composables/use-datefns';
import { useApi } from '#/composables/apis';

const { t } = useTranslation();
const theme = useTheme();

/**
 * Return a UI colour given log severity
 */
function getColorFromSeverity(severity: LogLevel | undefined): string {
  switch (severity) {
    case LogLevel.Trace: {
      return theme.current.value.colors.success;
    }
    case LogLevel.Debug: {
      return theme.current.value.colors.accent;
    }
    case LogLevel.Information: {
      return theme.current.value.colors.info;
    }
    case LogLevel.Warning: {
      return theme.current.value.colors.warning;
    }
    case LogLevel.Error: {
      return theme.current.value.colors.error;
    }
    case LogLevel.Critical: {
      return theme.current.value.colors.secondary;
    }
    default: {
      return theme.current.value.colors.primary;
    }
  }
}

/**
 * Gets an icon given an activity type
 */
function getIconFromActivityType(
  type: string | undefined | null
) {
  switch (type) {
    case 'SessionStarted': {
      return 'i-mdi:login';
    }
    case 'SessionEnded': {
      return 'i-mdi:logout';
    }
    case 'UserPasswordChanged': {
      return 'i-mdi:lock';
    }
    case 'VideoPlayback': {
      return 'i-mdi:play';
    }
    case 'VideoPlaybackStopped': {
      return 'i-mdi-stop';
    }
    default: {
      return 'i-mdi:help';
    }
  }
}

/**
 * Format activitydates
 */
function getFormattedActivityDate(date: string | undefined): string | undefined {
  return date
    ? useDateFns(formatRelative, parseJSON(date), new Date())
    : undefined;
}

/**
 * Format log dates
 */
function getFormattedLogDate(date: string | undefined): string | undefined {
  return date ? useDateFns(format, parseJSON(date), 'Ppp') : undefined;
}

/**
 * Creates a link to the given type of log file
 */
function getLogFileLink(name: string): string | undefined {
  return remote.sdk.api?.basePath && remote.auth.currentUserToken.value
    ? `${remote.sdk.api.basePath}/System/Logs/Log?name=${name}&api_key=${remote.auth.currentUserToken.value}`
    : undefined;
}

const [{ data: logs }, { data: activityList }] = await Promise.all([
  useApi(getSystemApi, 'getServerLogs')(),
  useApi(getActivityLogApi, 'getLogEntries')()
]);
</script>
