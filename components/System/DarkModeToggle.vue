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
          {{ darkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
        </v-icon>
      </v-btn>
    </template>
    <span>{{
      darkMode
        ? $t('tooltips.switchToLightMode')
        : $t('tooltips.switchToDarkMode')
    }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapActions } from 'vuex';

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapState('displayPreferences', ['darkMode'])
  },
  methods: {
    ...mapActions('displayPreferences', ['setDarkMode']),
    toggleDarkMode(): void {
      this.setDarkMode({ darkMode: !this.darkMode });
    }
  }
});
</script>
