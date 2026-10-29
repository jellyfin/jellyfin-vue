<template>
  <SettingsPage>
    <template #title>
      {{ t('logsAndActivity') }}
    </template>
    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <JTransition group>
          <h2
            key="logs-title"
            class="text-h6 uno-mb-2">
            {{ t('logs') }}
          </h2>
          <VList
            v-if="logs.length"
            key="log-list"
            lines="two"
            class="uno-mb-2">
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
        class="uno-pb-4 uno-pt-0">
        <JTransition group>
          <h2
            key="activity-title"
            class="text-h6 uno-mb-2">
            {{ t('activity') }}
          </h2>
          <VList
            v-if="activityList.length"
            key="activity-list"
            lines="two"
            class="uno-mb-2">
            <VListItem
              v-for="activity in activityList"
              :key="activity.Id"
              :title="activity.Name"
              :subtitle="activity.ShortOverview ?? undefined">
              <template #prepend>
                <JAvatar :color="getColorFromSeverity(activity.Severity)">
                  <JIcon
                    class="uno-text-white"
                    :class="getIconFromActivityType(activity.Type)" />
                </JAvatar>
              </template>
              <template #append>
                <VListItemSubtitle class="first-letter:uno-uppercase">
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

<script setup lang="ts">
import {
  LogLevel
} from '@jellyfin/sdk/lib/generated-client';
import type { ColorPalette } from '@jellyfin-vue/configs/uno/colors';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { format, formatRelative, parseJSON } from 'date-fns';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useDateFns } from '#/composables/use-datefns.ts';
import { useApi } from '#/composables/apis.ts';

definePage({
  meta: {
    admin: true,
    layout: {
      transition: {}
    }
  }
});

const { t } = useTranslation();

/**
 * Return a UI colour given log severity
 */
function getColorFromSeverity(severity: LogLevel | undefined): ColorPalette {
  switch (severity) {
    case LogLevel.Trace: {
      return 'success';
    }
    case LogLevel.Debug: {
      return 'accent';
    }
    case LogLevel.Information: {
      return 'info';
    }
    case LogLevel.Warning: {
      return 'warning';
    }
    case LogLevel.Error: {
      return 'error';
    }
    case LogLevel.Critical: {
      return 'secondary';
    }
    default: {
      return 'primary';
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
  useApi(getSystemApi, 'getLogEntries')()
]);
</script>
