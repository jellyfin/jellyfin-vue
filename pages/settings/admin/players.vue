<template>
  <settings-page page-title="settingsSections.user.mediaPlayers.name">
    <template #content>
      <v-row>
        <v-card-actions>
          <v-icon>mdi-apple-airplay</v-icon>
        </v-card-actions>
        <v-card-title>
          {{ $t('settings.players.airplay') }}
        </v-card-title>
      </v-row>
      <v-card-subtitle>
        {{ $t('settings.players.airplayDescription') }}
      </v-card-subtitle>
      <v-divider />

      <v-row justify="end" align="end" class="pa-5">
        <v-card-actions>
          <v-switch v-model="airplay" />
        </v-card-actions>
      </v-row>
      <!-- TODO: Bind this to user's settings, so this warning is only shown when
        crossfade (or other incompatible settings with the platform) are enabled.
        Ellaborate also a way to generate this incompatibilities programatically -->
      <v-slide-y-transition>
        <v-alert v-if="airplay" type="warning" outlined prominent border="left">
          {{ $t('settings.players.disabledFeatures') }}
          <br />
          <br />
          <strong> · Crossfade</strong>
        </v-alert>
      </v-slide-y-transition>

      <v-row>
        <v-card-actions>
          <v-icon>mdi-cast</v-icon>
        </v-card-actions>
        <v-card-title>
          {{ $t('settings.players.gcast') }}
        </v-card-title>
      </v-row>
      <v-card-subtitle>
        {{ $t('settings.players.gcastDescription') }}
      </v-card-subtitle>
      <v-divider />

      <v-row justify="end" align="end" class="pa-5">
        <v-card-actions>
          <v-switch v-model="gcast" />
        </v-card-actions>
      </v-row>
      <!-- TODO: Bind this to user's settings, so this warning is only shown when
        crossfade (or other incompatible settings with the platform) are enabled.
        Ellaborate also a way to generate this incompatibilities programatically -->
      <v-slide-y-transition>
        <v-alert v-if="gcast" type="warning" outlined prominent border="left">
          {{ $t('settings.players.disabledFeatures') }}
          <br />
          <br />
          <strong> · Crossfade</strong>
        </v-alert>
      </v-slide-y-transition>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      airplay: false,
      gcast: false
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({
      title: this.$t('settingsSections.user.mediaPlayers.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
