<template>
  <v-container class="ma-0">
    <v-row class="flex-lg-nowrap">
      <v-fade-transition appear mode="out-in">
        <v-col
          v-if="
            $vuetify.breakpoint.lgAndUp ||
            ($vuetify.breakpoint.mdAndDown && inMenu)
          "
          cols="12"
          lg="5"
        >
          <v-card>
            <v-fade-transition
              appear
              mode="out-in"
              group
              @after-leave="transitioning = false"
              @before-leave="transitioning = true"
            >
              <!-- User settings -->
              <user-settings
                v-if="mainSettings && !transitioning"
                key="main-settings"
              />
              <!-- Administrator settings -->
              <admin-settings
                v-else-if="serverSettings && !transitioning"
                key="server-settings"
              />
            </v-fade-transition>
          </v-card>
        </v-col>
      </v-fade-transition>
      <v-col>
        <v-card
          min-width="100%"
          max-height="100%"
          class="d-flex flex-grow-1 flex-shrink-0 overflow-y-scroll justify-center"
        >
          <v-container>
            <v-fade-transition mode="out-in">
              <nuxt-child keep-alive />
            </v-fade-transition>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      transitioning: false
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    inMenu: {
      get(): boolean {
        const fullPath = this.$route.fullPath;
        return fullPath === '/settings' || fullPath === '/settings/admin';
      }
    },
    mainSettings: {
      get(): boolean {
        return this.$route.fullPath.includes('/settings');
      }
    },
    serverSettings: {
      get(): boolean {
        return this.$route.fullPat.includes('/settings/admin');
      }
    }
  },
  watch: {
    mainSettings: {
      immediate: true,
      handler(): void {
        this.setPageTitle({ title: this.$t('settings.settings') });
      }
    }
  },
  beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity'])
  }
});
</script>
