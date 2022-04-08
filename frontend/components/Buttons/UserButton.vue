<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div
        v-ripple
        class="d-flex align-center full-width py-8 px-4 no-overflow"
        v-bind="attrs"
        v-on="on"
      >
        <user-image v-if="auth.currentUser" :user="auth.currentUser" />
        <h1
          v-if="auth.currentUser"
          class="flex-grow-1 font-weight-light ml-3 pb-1 text-truncate user-select-none"
        >
          {{ auth.currentUser.Name }}
        </h1>
        <v-icon>mdi-dots-horizontal</v-icon>
      </div>
    </template>
    <v-list dense>
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="`bottomMenuItems-${index}`"
        @click="item.action"
      >
        <v-list-item-icon>
          <v-icon small>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { authStore } from '~/store';

interface MenuItem {
  title: string;
  icon: string;
  action: () => void;
}

export default Vue.extend({
  data() {
    return {
      avatarSize: 48
    };
  },
  computed: {
    ...mapStores(authStore),
    menuItems(): MenuItem[] {
      const menuItems = [];

      if (this.auth.currentUser?.Policy?.IsAdministrator) {
        menuItems.push({
          title: this.$t('metadataEditor'),
          icon: 'mdi-pencil',
          action: (): void => {
            this.$router.push('/metadata');
          }
        });
      }

      menuItems.push({
        title: this.$t('settings.settings'),
        icon: 'mdi-cog',
        action: (): void => {
          this.$router.push('/settings');
        }
      });

      menuItems.push({
        title: this.$t('logout'),
        icon: 'mdi-logout',
        action: (): void => {
          this.auth.logoutUser(true);
        }
      });

      return menuItems;
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

.user-select-none {
  user-select: none;
}
</style>
