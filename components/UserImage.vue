<template>
  <v-avatar>
    <lazy-image v-if="userImage" :src="userImage" />
    <v-icon v-else dark>mdi-account</v-icon>
  </v-avatar>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    userImage: {
      get() {
        if (this.$auth.user?.PrimaryImageTag) {
          return `${this.$axios.defaults.baseURL}/Users/${this.$auth.user.Id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&quality=90`;
        } else {
          return '';
        }
      }
    }
  }
});
</script>
