<template>
  <v-container>
    <v-row>
      <v-col cols="12" :offset-md="1" md="5" class="pt-0 pb-4">
        <h2 class="text-h6 mb-2">{{ $t('logs') }}</h2>
        <v-list v-if="logFiles && logFiles.length > 0" two-line class="mb-2">
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
                <v-icon>mdi-chevron-right</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
        <v-card v-else>
          <v-card-text>{{ $t('noResultsFound') }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="5" class="pt-0 pb-4">
        <h2 class="text-h6 mb-2">{{ $t('activity') }}</h2>
        <v-list
          v-if="activityList && activityList.length > 0"
          two-line
          class="mb-2"
          disabled
        >
          <v-list-item-group>
            <v-list-item v-for="activity in activityList" :key="activity.Id">
              <v-list-item-avatar
                :color="getColorFromSeverity(activity.Severity)"
              >
                <v-icon dark v-text="getIconFromType(activity.Type)"></v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="decodeHTML(activity.Name)" />
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
        <v-card v-else>
          <v-card-text>{{ $t('noResultsFound') }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import colors from 'vuetify/lib/util/colors';
import { ActivityLogEntry, LogFile, LogLevel } from '@jellyfin/client-axios';
import { decodeHTML } from 'entities';
import htmlHelper from '~/mixins/htmlHelper';

export default Vue.extend({
  mixins: [htmlHelper],
  middleware: 'adminMiddleware',
  data() {
    return {
      activityList: [] as ActivityLogEntry[],
      logFiles: [] as LogFile[]
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  async beforeMount() {
    this.setPageTitle({ title: this.$t('settingsSections.logs.name') });

    // Only fetch the activity for the last 7 days
    // TODO: Add this as a filter
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 7);
    this.activityList =
      (await this.$api.activityLog.getLogEntries({ minDate })).data.Items || [];
    this.logFiles = (await this.$api.system.getServerLogs()).data;
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
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
      return (
        this.$axios.defaults.baseURL +
        '/System/Logs/Log?name=' +
        name +
        '&api_key=' +
        this.$store.state.user.accessToken
      );
    },
    decodeHTML
  }
});
</script>

<style>
.text-capitalize-first-letter::first-letter {
  text-transform: uppercase;
}
</style>
