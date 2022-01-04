<template>
  <v-navigation-drawer
    v-if="page.navDrawer"
    v-model="page.openDrawer"
    app
    :temporary="$vuetify.breakpoint.mobile"
    :permanent="!$vuetify.breakpoint.mobile"
    floating
    clipped
    class="pa-s"
    :class="{
      transparent: page.transparentLayout && !$vuetify.breakpoint.mobile
    }"
  >
    <v-list>
      <v-list-item
        v-for="item in items"
        :key="item.Id"
        :to="item.to"
        router
        exact
      >
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="item.title" />
        </v-list-item-content>
      </v-list-item>
      <v-subheader>{{ $t('libraries') }}</v-subheader>
      <v-list-item
        v-for="library in userViews.getNavigationDrawerItems"
        :key="library.Id"
        :to="library.to"
        router
        exact
      >
        <v-list-item-action>
          <v-icon>{{ library.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="library.title" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <template #append>
      <commit-link />
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { userViewsStore, pageStore } from '~/store';

interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}

export default Vue.extend({
  watch: {
    $route(to): void {
      if (to.fullPath.includes('fullscreen')) {
        this.page.navDrawer = false;
      } else if (!this.page.navDrawer) {
        this.page.navDrawer = true;
      }
    },
    '$vuetify.breakpoint.mobile': {
      immediate: true,
      handler(newVal: boolean): void {
        if (newVal === true) {
          this.page.openDrawer = false;
        }
      }
    }
  },
  computed: {
    ...mapStores(userViewsStore, pageStore),
    items(): LayoutButton[] {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    }
  },
  async beforeMount() {
    await this.userViews.refreshUserViews();
  }
});
</script>
