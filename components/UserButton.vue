<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div
        class="d-flex align-center no-overflow space-evenly"
        v-bind="attrs"
        v-on="on"
      >
        <user-image />
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
            this.logoutUser();
          }
        }
      ];
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

<style lang="scss" scoped>
.space-evenly {
  flex: 1 !important;
  justify-content: space-evenly !important;
}

.no-overflow {
  max-width: 100%;
}
</style>
