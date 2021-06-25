<template>
  <v-navigation-drawer
    v-model="drawer"
    :temporary="display.mobile"
    :permanent="!display.mobile"
    app
    class="pa-s"
  >
    <template #prepend>
      <user-button />
      <v-divider />
    </template>
    <v-list>
      <!--
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
      </v-list-item>-->
      <v-subheader>{{ t('libraries') }}</v-subheader>
      <!-- <v-list-item
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
      </v-list-item> -->
    </v-list>
    <template #append>
      <connection-monitor />
      <syncing-monitor />
    </template>
  </v-navigation-drawer>
  <v-app-bar
    :clipped-left="display.mobile"
    app
    :class="{ opaque: opaqueAppBar }"
  >
    <v-app-bar-nav-icon
      v-if="display.mobile && navDrawer"
      @click.stop="drawer = !drawer"
    />
    <v-btn
      :icon="opaqueAppBar || display.xsOnly || isScrolled"
      :fab="!(opaqueAppBar || display.xsOnly) && !isScrolled"
      :small="!(opaqueAppBar || display.xsOnly) && !isScrolled"
      :class="{
        'ml-n1': opaqueAppBar || display.xsOnly || isScrolled,
        'mr-2': !(opaqueAppBar || display.xsOnly) && !isScrolled,
        'mr-1': opaqueAppBar || display.xsOnly || isScrolled
      }"
      @click="router.back()"
    >
      <!--<v-icon>mdi-arrow-left</v-icon>-->
    </v-btn>
    <v-text-field
      class="search-input"
      :class="display.mdAndUp ? 'expandable' : null"
      prepend-inner-icon="mdi-magnify"
      :placeholder="t('search')"
      max-width="15em"
      dense
      outlined
      filled
      flat
      hide-details
      single-line
    />
    <v-spacer />
    <dark-mode-toggle :fab="!(opaqueAppBar || display.xsOnly) && !isScrolled" />
    <locale-switcher
      :fab="!(opaqueAppBar || display.xsOnly) && !isScrolled"
      bottom
    />
    <cast-button :fab="!(opaqueAppBar || display.xsOnly) && !isScrolled" />
  </v-app-bar>
  <v-main>
    <div class="pa-s">
      <router-view />
    </div>
  </v-main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useEventListener } from '@vueuse/core';
import { useStore } from '../store';
import { useDisplay } from 'vuetify/lib/composables/display';

// import { BaseItemDto } from '@jellyfin/client-axios';
// import { stringify } from 'qs';
// import { mapActions, mapState } from 'vuex';
/* import { AppState } from '~/store';
import { getLibraryIcon } from '~/utils/items';
import settingsHelper from '~/mixins/settingsHelper'; */

/*interface LayoutButton {
  icon: string;
  title: string;
  to: string;
}*/

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const store = useStore();

const y = ref(window.scrollY);
useEventListener(
  'scroll',
  () => {
    y.value = window.scrollY;
  },
  {
    capture: false,
    passive: true
  }
);
const isScrolled = computed(() => y.value > 10);

const drawer = ref(true);
const navDrawer = computed(() => store.state.page.navDrawer);

const opaqueAppBar = computed(() => store.state.page.opaqueAppBar);

const display = useDisplay();

//export default defineComponent({
// mixins: [settingsHelper],
/*
  data() {
    return {
      isScrolled: false,
      drawer: false
    };
  }
  /*
  computed: {
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
    ...mapState('user', ['accessToken']),
    ...mapState('deviceProfile', ['deviceId']),
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
  beforeMount() {
    this.refreshUserViews();

    const socketParams = stringify({
      api_key: this.accessToken,
      deviceId: this.deviceId
    });
    let socketUrl = `${this.$axios.defaults.baseURL}/socket?${socketParams}`;

    socketUrl = socketUrl.replace('https:', 'wss:');
    socketUrl = socketUrl.replace('http:', 'ws:');

    this.$connect(socketUrl);
  },
  methods: {
    ...mapActions('userViews', ['refreshUserViews']),
    ...mapActions('page', ['showNavDrawer']),
  });*/
</script>

<style lang="scss" scoped>
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
  transition: max-width 0.25s;
}

.search-input.expandable.primary--text {
  max-width: 40em;
  transition: max-width 0.25s;
}
</style>
