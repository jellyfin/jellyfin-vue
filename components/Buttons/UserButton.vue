<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div
        v-ripple
        class="d-flex align-center full-width py-8 px-4 no-overflow"
        v-bind="attrs"
        v-on="on"
      >
        <user-image />
        <h1
          v-if="$auth.user"
          class="flex-grow-1 font-weight-light ml-3 pb-1 text-truncate user-select-none"
        >
          {{ $auth.user.Name }}
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
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';

interface MenuItem {
  title: string;
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
          action: (): void => {
            this.$router.push('/metadata');
          }
        });
      }

      menuItems.push({
        title: this.$t('settings.settings'),
        action: (): void => {
          this.$router.push('/settings');
        }
      });

      menuItems.push({
        title: this.$t('logout'),
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
</style>
