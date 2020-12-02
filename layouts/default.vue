<template>
  <v-app ref="app">
    <backdrop />
    <v-navigation-drawer
      v-model="drawer"
      :temporary="$vuetify.breakpoint.mobile"
      app
    >
      <template #prepend>
        <div class="d-flex align-center full-width pa-6">
          <v-avatar size="48" color="primary" class="mr-4">
            <img
              v-if="$auth.user.PrimaryImageTag"
              :src="`${$axios.defaults.baseURL}/Users/${$auth.user.Id}/Images/Primary/?tag=${$auth.user.PrimaryImageTag}&maxWidth=64`"
            />
            <span v-else class="white--text">
              {{ $auth.user.Name.charAt(0) }}
            </span>
          </v-avatar>
          <h1 class="font-weight-light">
            {{ $auth.user.Name }}
          </h1>
          <connection-monitor class="ml-auto" />
        </div>
        <v-divider></v-divider>
      </template>
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
    <v-app-bar
      :clipped-left="$vuetify.breakpoint.mobile"
      class="pl-2 pr-2"
      flat
      app
      :class="{ opaque: opaqueAppBar }"
    >
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile"
        @click.stop="drawer = !drawer"
      />
      <v-btn
        v-if="$route.name !== 'index'"
        class="mr-2"
        icon
        @click="$router.back()"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-text-field
        class="search-input"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search"
        max-width="15em"
        dense
        outlined
        filled
        flat
        hide-details
        single-line
      />
      <v-spacer />
      <locale-switcher class="mr-2" />
      <user-button v-if="$auth.loggedIn" />
    </v-app-bar>
    <v-main>
      <nuxt />
    </v-main>
    <!-- Utilities and global systems -->
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  data() {
    return {
      drawer: true,
      opacity: 0
    };
  },
  computed: {
    ...mapState('page', ['opaqueAppBar']),
    items() {
      return [
        {
          icon: 'mdi-home',
          title: this.$t('home'),
          to: '/'
        }
      ];
    },
    libraries() {
      return this.$store.getters['userViews/getNavigationDrawerItems'];
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
  beforeMount() {
    this.refreshUserViews();
  },
  methods: {
    ...mapActions('userViews', ['refreshUserViews'])
  }
});
</script>

<style lang="scss" scoped>
.v-application {
  background-color: var(--v-background-base) !important;
}

.v-app-bar:not(.v-app-bar--is-scrolled):not(.opaque) {
  background-color: transparent !important;
}

.v-app-bar .v-app-bar--is-scrolled:not(.opaque) {
  padding-top: 0;
  padding-bottom: 0;
  background-color: rgba(32, 32, 32, 1) !important;
}

.search-input {
  max-width: 15em;
}
</style>
