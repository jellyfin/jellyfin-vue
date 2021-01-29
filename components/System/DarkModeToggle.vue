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
        @click="darkMode = !darkMode"
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
import { mapGetters, mapActions } from 'vuex';

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapGetters('displayPreferences', ['getDarkMode']),
    darkMode: {
      get(): boolean {
        return this.getDarkMode;
      },
      set(value: boolean): void {
        this.setDarkMode({ darkMode: value });
      }
    }
  },
  methods: {
    ...mapActions('displayPreferences', ['setDarkMode'])
  }
});
</script>
