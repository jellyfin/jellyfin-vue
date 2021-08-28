<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <v-btn
        class="align-self-center active-button ml-2"
        icon
        v-bind="attrs"
        v-on="on"
      >
        <user-image v-if="$auth.user" :user="$auth.user" :size="48" />
      </v-btn>
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
    menuItems(): MenuItem[] {
      const menuItems = [];

      if (this.$auth.$state.user?.Policy?.IsAdministrator) {
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
      this.$disconnect();
      this.$auth.logout();
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
