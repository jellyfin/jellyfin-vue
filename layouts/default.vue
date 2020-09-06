<template>
  <v-app dark>
    <v-navigation-drawer v-model="drawer" :clipped="clipped" fixed app>
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
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
      </v-list>
      <v-divider v-if="libraries.length > 0"></v-divider>
      <v-list>
        <v-list-item
          v-for="(library, i) in libraries"
          :key="i"
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
      <v-divider></v-divider>
      <v-list>
        <v-list-item
          v-for="(item, i) in configItems"
          :key="i"
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
      </v-list>
    </v-navigation-drawer>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title v-text="title" />
      <v-spacer />
      <locale-switcher />
      <user-button v-if="$auth.loggedIn" />
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <nuxt />
      </v-container>
    </v-main>
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api/api';
import { getLibraryIcon } from '~/utils/items';

interface NavigationDrawerItem {
  icon: string | undefined | null;
  title: string | undefined | null;
  to: string;
}

export default Vue.extend({
  data() {
    return {
      clipped: true,
      drawer: true,
      libraries: {},
      miniVariant: false,
      title: 'Jellyfin'
    };
  },
  computed: {
    items() {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    },
    configItems() {
      return [
        {
          icon: 'mdi-cog',
          title: this.$t('settings'),
          to: '/settings'
        }
      ];
    }
  },
  async beforeMount() {
    const userViewsRequest = await this.$userViewsApi.getUserViews({
      userId: this.$auth.user.Id
    });

    let userViews: Array<NavigationDrawerItem> = [];

    if (userViewsRequest.data.Items) {
      userViews = userViewsRequest.data.Items.map(
        (view: BaseItemDto): NavigationDrawerItem => {
          return {
            icon: getLibraryIcon(view.CollectionType),
            title: view.Name,
            to: `/library/${view.Id}`
          };
        }
      );
    }

    this.libraries = userViews;
  }
});
</script>
