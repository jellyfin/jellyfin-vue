<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div class="d-flex align-center no-overflow" v-bind="attrs" v-on="on">
        <v-avatar :size="avatarSize" color="primary" class="mr-4">
          <v-img :src="userImage" :alt="$auth.user.Name">
            <template #placeholder>
              <v-icon dark>mdi-account</v-icon>
            </template>
          </v-img>
        </v-avatar>
        <h1 class="font-weight-light pb-1 text-truncate">
          {{ $auth.user.Name }}
        </h1>
        <v-icon>mdi-chevron-down</v-icon>
      </div>
    </template>
    <v-list dense>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="`bottomMenuItems-${index}`"
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
      avatarSize: 48
    };
  },
  computed: {
    menuItems() {
      return [
        {
          title: this.$t('logout'),
          action: () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- False-positive due to Vuex's bad Typescript support
            // @ts-ignore
            this.logoutUser();
          }
        }
      ];
    },
    userImage(): string {
      if (this.$auth.user?.PrimaryImageTag) {
        return `${this.$axios.defaults.baseURL}/Users/${this.$auth.user.Id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&maxWidth=${this.avatarSize}`;
      } else {
        return '';
      }
    }
  },
  methods: {
    ...mapActions('user', ['clearUser']),
    ...mapActions('deviceProfile', ['clearDeviceProfile']),
    logoutUser() {
      this.$disconnect();
      this.$auth.logout();
      this.clearDeviceProfile();
      this.clearUser();
    }
  }
});
</script>

<style scoped>
.no-overflow {
  max-width: 100%;
}
</style>
