<template>
  <div class="grid pa-2" :class="$vuetify.breakpoint.smAndDown ? 'sm' : null">
    <v-fade-transition appear mode="out-in">
      <v-col
        v-if="
          $vuetify.breakpoint.mdAndUp ||
          ($vuetify.breakpoint.smAndDown && inMenu)
        "
      >
        <v-card :class="$vuetify.breakpoint.smAndDown ? null : 'column'">
          <v-fade-transition
            appear
            mode="out-in"
            group
            @after-leave="transitioning = false"
            @before-leave="transitioning = true"
          >
            <!-- Administrator settings -->
            <admin-settings
              v-if="serverSettings && !transitioning"
              key="server-settings"
            />
            <!-- User settings -->
            <user-settings
              v-else-if="mainSettings && !transitioning"
              key="main-settings"
            />
          </v-fade-transition>
        </v-card>
      </v-col>
    </v-fade-transition>
    <v-col>
      <v-card :class="$vuetify.breakpoint.smAndDown ? null : 'column'">
        <v-container>
          <v-fade-transition mode="out-in">
            <nuxt-child :key="$route.fullPath" keep-alive />
          </v-fade-transition>
        </v-container>
      </v-card>
    </v-col>
  </div>
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
        return this.$route.fullPath.includes('/settings/admin');
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

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 35% 65%;
  grid-template-rows: 91vh;
}

.sm {
  grid-template-columns: 100% !important;
  grid-template-rows: unset !important;
}

.column {
  max-height: 100%;
  min-height: 100%;
  overflow-y: scroll;
}
</style>
