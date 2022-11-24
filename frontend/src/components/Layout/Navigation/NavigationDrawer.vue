<template>
  <v-navigation-drawer
    v-if="page.navDrawer"
    v-model="page.openDrawer"
    app
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    floating
    clipped
    class="pa-s"
    :class="{
      transparent: transparentLayout && !$vuetify.display.mobile
    }">
    <v-list nav>
      <v-list-item
        v-for="item in items"
        :key="item.Id"
        :to="item.to"
        router
        exact>
        <v-list-item-action>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-title v-text="item.title" />
      </v-list-item>
      <v-list-subheader>{{ $t('libraries') }}</v-list-subheader>
      <v-list-item
        v-for="library in userViews.getNavigationDrawerItems"
        :key="library.Id"
        :to="library.to"
        router
        exact>
        <v-list-item-action>
          <v-icon>{{ library.icon }}</v-icon>
        </v-list-item-action>
        <v-list-item-title v-text="library.title" />
      </v-list-item>
    </v-list>
    <template #append>
      <commit-link />
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { useRoute } from 'vue-router';
import { defineComponent, computed } from 'vue';
import { mapStores } from 'pinia';
import { userViewsStore } from '~/store';

interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}

export default defineComponent({
  setup() {
    const route = useRoute();

    const transparentLayout = computed<boolean>(() => {
      return route.meta.transparentLayout || false;
    });

    return { transparentLayout };
  },
  computed: {
    ...mapStores(userViewsStore),
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
  watch: {
    $route(to): void {
      if (to.fullPath.includes('fullscreen')) {
        this.page.navDrawer = false;
      } else if (!this.page.navDrawer) {
        this.page.navDrawer = true;
      }
    },
    '$vuetify.display.mobile': {
      immediate: true,
      handler(newValue: boolean): void {
        if (newValue === true) {
          this.page.openDrawer = false;
        }
      }
    }
  }
});
</script>
