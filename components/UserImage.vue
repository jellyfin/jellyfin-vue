<template>
  <v-avatar>
    <v-img
      v-if="userImage"
      :src="userImage"
      :alt="$auth.user.Name"
      class="userImage"
    ></v-img>
    <v-icon v-else dark>mdi-account</v-icon>
  </v-avatar>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    id: {
      type: String,
      required: false,
      default: ''
    },
    quality: {
      type: Number,
      required: false,
      default: 90
    }
  },
  computed: {
    userImage: {
      get(): string {
        if (this.id === '') {
          return `${this.$axios.defaults.baseURL}/Users/${this.$auth.user.Id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&quality=${this.quality}`;
        } else {
          return `${this.$axios.defaults.baseURL}/Users/${this.id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&quality=${this.quality}`;
        }
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.userImage {
  image-rendering: crisp-edges;
}
</style>
