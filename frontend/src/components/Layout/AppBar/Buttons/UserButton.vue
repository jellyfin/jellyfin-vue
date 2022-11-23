<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <app-bar-button-layout :custom-listener="on" v-bind="attrs">
        <template #icon>
          <user-image
            v-if="auth.currentUser"
            :user="auth.currentUser"
            :size="40"
            rounded />
        </template>
      </app-bar-button-layout>
    </template>
    <v-list class="min-list-width" dense>
      <v-list-item>
        <v-avatar>
          <user-image
            v-if="auth.currentUser"
            :user="auth.currentUser"
            :size="40"
            rounded />
        </v-avatar>
        <v-list-item-title class="text-body-1">
          {{ auth.currentUser.Name }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="auth.currentUser.Policy.IsAdministrator">
          {{ $t('administrator') }}
          <v-icon size="small">mdi-key-chain</v-icon>
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider class="my-2" light />
      <v-list-item
        v-for="(item, index) in menuItems"
        :key="`bottomMenuItems-${index}`"
        @click="item.action">
        <v-icon size="small">{{ item.icon }}</v-icon>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

interface MenuItem {
  title: string;
  icon: string;
  action: () => void;
}

export default defineComponent({
  data() {
    return {
      avatarSize: 48
    };
  },
  computed: {
    menuItems(): MenuItem[] {
      const menuItems = [];

      if (this.$remote.auth.currentUser.value?.Policy?.IsAdministrator) {
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

.min-list-width {
  min-width: 200px;
}
</style>
