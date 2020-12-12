<template>
  <v-container>
    <v-row>
      <v-col cols="12" :offset-md="1" md="5" class="pt-0 pb-4">
        <v-list two-line class="mb-2">
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
      </v-col>
      <v-col cols="12" md="5" class="pt-0 pb-4">
        <v-list two-line class="mb-2" disabled>
          <v-list-item-group>
            <v-list-item v-for="activity in activityList" :key="activity.Id">
              <v-list-item-avatar
                :color="getColorFromSeverity(activity.Severity)"
              >
                <v-icon>mdi-shield-account-outline</v-icon>
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import colors from 'vuetify/lib/util/colors';
import { ActivityLogEntry, LogFile, LogLevel } from '@jellyfin/client-axios';
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
    // calculating date of 7 days ago as min date to get activity logs
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
    getFormattedActivityDate(date: Date): string {
      const today = this.$dateFns.endOfToday();
      const day = this.$dateFns.formatRelative(
        this.$dateFns.parseJSON(date),
        today
      );
      return day;
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
    }
  }
});
</script>

<style>
.text-capitalize-first-letter::first-letter {
  text-transform: uppercase;
}
</style>
