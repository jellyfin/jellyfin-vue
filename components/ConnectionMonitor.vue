<template>
  <v-overlay z-index="100" opacity="0.75" :value="isDisconnected">
    <div class="d-flex flex-column">
      <v-icon size="128">mdi-network-off-outline</v-icon>
      <h2 class="mt-3">{{ $t('noNetworkConnection') }}</h2>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    isDisconnected() {
      return !this.$nuxt.isOnline;
    }
  }
});
</script>
