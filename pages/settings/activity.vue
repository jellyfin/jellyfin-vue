<template>
  <v-container>
    <v-row>
      <v-col cols="12" :offset-md="1" md="5" class="pt-0 pb-4">
        <!-- Administrator settings -->
        <v-list
          v-if="$auth.user.Policy.IsAdministrator"
          two-line
          class="mb-4"
          disabled
        >
          <v-list-item-group>
            <v-list-item v-for="activity in activityList" :key="activity.Id">
              <v-list-item-avatar>
                <v-icon>mdi-shield-account-outline</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="activity.Name" />
                <v-list-item-subtitle v-text="activity.ShortOverview" />
              </v-list-item-content>
              <v-list-item-action>
                <v-list-item-subtitle v-text="activity.Date" />
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
            >
              <v-list-item-avatar>
                <v-icon v-text="linkItem.icon" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-text="linkItem.name" />
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-chevron-right</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { isEmpty } from 'lodash';
import Vue from 'vue';
import { mapActions } from 'vuex';
import { SystemInfo } from '~/api';
import htmlHelper from '~/mixins/htmlHelper';

export default Vue.extend({
  mixins: [htmlHelper],
  data() {
    return {
      activityList: {} as SystemInfo
    };
  },
  async beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.setPageTitle({ title: this.$t('settings') });

    if (this.$auth.user.Policy.IsAdministrator) {
      this.activityList = (await this.$api.system.getActivityLogs()).data.Items;
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
