<template functional>
  <v-chip color="green" class="card-chip" small>
    <v-icon>mdi-check</v-icon>
  </v-chip>
</template>

<script lang="ts">
import Vue from 'vue';
import { VChip, VIcon } from 'vuetify/lib';

Vue.component('VChip', VChip);
Vue.component('VIcon', VIcon);

export default Vue.extend({
  name: 'WatchedIndicator'
});
</script>

<style lang="scss" scoped>
.card-chip {
  position: absolute;
  top: 1em;
  right: 1em;
}
</style>
