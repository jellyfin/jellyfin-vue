<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        :icon="!fab"
        :fab="fab"
        :small="fab"
        :class="{ 'mr-n1': !fab }"
        v-bind="attrs"
        v-on="on"
        @click="toggleDarkMode"
      >
        <v-icon>
          {{
            clientSettings.darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'
          }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{
      clientSettings.darkMode
        ? $t('tooltips.switchToLightMode')
        : $t('tooltips.switchToDarkMode')
    }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { clientSettingsStore } from '~/store';

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapStores(clientSettingsStore)
  },
  methods: {
    toggleDarkMode(): void {
      this.clientSettings.setDarkMode(!this.clientSettings.darkMode);
    }
  }
});
</script>
