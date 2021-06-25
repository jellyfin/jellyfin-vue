<template>
  <!--<v-tooltip bottom>
    <template #activator="{ on, attrs }">-->
  <v-btn
    :icon="!fab"
    :fab="fab"
    :small="fab"
    :class="{ 'mr-n1': !fab }"
    @click="setDarkMode({ darkMode: !darkMode })"
  >
    <v-icon>
      {{
        store.state.clientSettings.darkMode
          ? 'mdi-weather-sunny'
          : 'mdi-weather-night'
      }}
    </v-icon>
  </v-btn>
  <!--</template>
    <span>{{
      darkMode
        ? $t('tooltips.switchToLightMode')
        : $t('tooltips.switchToDarkMode')
    }}</span>
  </v-tooltip>-->
</template>

<script setup="props" lang="ts">
import { defineProps } from 'vue';
import { createNamespacedHelpers } from 'vuex-composition-helpers';
import { useStore } from '../../store';

const props = defineProps({
  fab: {
    type: Boolean,
    required: false
  }
});

const store = useStore();

const { useState, useActions } = createNamespacedHelpers(
  store,
  'clientSettings'
);

const { setDarkMode } = useActions(['setDarkMode']);
const { darkMode } = useState(['darkMode']);
</script>
