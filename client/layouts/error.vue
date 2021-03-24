<template>
  <div>
    <v-row justify="center" class="mt-16 mb-4">
      <v-icon :color="icon.color" size="72">{{ icon.icon }}</v-icon>
    </v-row>
    <v-row justify="center">
      <h1 class="text-h4 text-center">{{ error.message }}</h1>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { NuxtError } from '@nuxt/types';

interface Icon {
  icon: string;
  color: string | undefined | null;
}

export default Vue.extend({
  props: {
    error: {
      type: Object as PropType<NuxtError>,
      default: { statusCode: -1, message: '' }
    }
  },
  computed: {
    icon(): Icon {
      switch (this.error.statusCode) {
        case 404:
          return { icon: 'mdi-alert', color: 'warning' };

        default:
          return { icon: 'mdi-alert-circle', color: 'error' };
      }
    }
  }
});
</script>
