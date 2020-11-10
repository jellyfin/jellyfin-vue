<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <UserImage />
      </v-btn>
    </template>
    <v-list>
      <v-list-item @click="switchColorScheme">
        <v-switch>
          <template #label>Toggle dark mode</template>
        </v-switch>
      </v-list-item>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="index"
        @click="item.action"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      menuItems: [
        {
          title: this.$t('logout'),
          action: () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- False-positive due to Vuex's bad Typescript support
            // @ts-ignore
            this.logoutUser();
          }
        }
      ]
    };
  },
  methods: {
    ...mapActions('user', ['setUser', 'clearUser']),
    ...mapActions('deviceProfile', ['clearDeviceProfile']),
    switchColorScheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    logoutUser() {
      this.$auth.logout();
      this.clearDeviceProfile();
      this.clearUser();
    }
  }
});
</script>
