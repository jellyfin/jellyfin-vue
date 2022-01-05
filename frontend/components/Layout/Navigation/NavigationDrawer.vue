<template>
  <v-navigation-drawer
    v-if="navDrawer"
    v-model="drawer"
    app
    :temporary="$vuetify.breakpoint.mobile"
    :permanent="!$vuetify.breakpoint.mobile"
    floating
    clipped
    class="pa-s"
    :class="{ transparent: !opaqueAppBar }"
  >
    <v-list nav>
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
        v-for="library in libraryItems"
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
      <v-list-item
        v-if="commit"
        :href="'https://github.com/jellyfin/jellyfin-vue/commit/' + commit"
      >
        <v-list-item-action>
          <v-icon>mdi-github</v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title v-text="'#' + commit.substring(0, 6)" />
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import { AppState } from '~/store';
import { getLibraryIcon } from '~/utils/items';

interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}

export default Vue.extend({
  data() {
    return {
      drawer: false
    };
  },
  computed: {
    ...mapState('page', ['navDrawer', 'opaqueAppBar', 'isScrolled']),
    ...mapState<AppState>({
      libraryItems: (state: AppState) =>
        state.userViews.views.map((view: BaseItemDto) => {
          return {
            icon: getLibraryIcon(view.CollectionType),
            title: view.Name,
            to: `/library/${view.Id}`
          };
        })
    }),
    commit() {
      return process.env.NUXT_ENV_COMMIT;
    },
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
        this.showNavDrawer({ showNavDrawer: false });
      } else if (!this.navDrawer) {
        this.showNavDrawer({ showNavDrawer: true });
      }
    },
    '$vuetify.breakpoint.mobile': {
      immediate: true,
      handler(newVal: boolean): void {
        if (newVal === true) {
          this.drawer = false;
        }
      }
    }
  },

  methods: {
    ...mapActions('page', ['showNavDrawer'])
  }
});
</script>

<style lang="scss" scoped>
.transparent {
  background-color: transparent !important;
}
</style>
