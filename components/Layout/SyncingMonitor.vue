<template>
  <div
    v-if="syncing"
    class="w-100 pa-3 d-flex flex-row justify-center align-center"
  >
    <v-progress-circular class="mr-2" indeterminate size="32" />
    <span>{{ $t('syncingInProgress') }}</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  computed: {
    ...mapState(['syncing'])
  }
});
</script>
