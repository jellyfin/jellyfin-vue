<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <app-bar-button-layout :custom-listener="on" v-bind="attrs">
        <template #icon>
          <user-image
            v-if="auth.currentUser"
            :user="auth.currentUser"
            :size="40"
            rounded
          />
        </template>
      </app-bar-button-layout>
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
          this.logoutUser();
        }
      });

      return menuItems;
    }
  },
  methods: {
    logoutUser(): void {
      this.auth.logoutCurrentUser();
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
