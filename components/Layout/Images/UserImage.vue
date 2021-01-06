<template>
  <v-avatar v-if="userImage">
    <v-img :src="userImage" :alt="$auth.user.Name" class="userImage">
      <template #placeholder>
        <v-avatar color="primary">
          <v-icon dark>mdi-account</v-icon>
        </v-avatar>
      </template>
    </v-img>
  </v-avatar>
  <v-avatar v-else color="primary">
    <v-icon dark>mdi-account</v-icon>
  </v-avatar>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    id: {
      type: String,
      required: false,
      default: undefined
    },
    quality: {
      type: Number,
      required: false,
      default: 90
    }
  },
  computed: {
    userImage: {
      get(): string | undefined {
        if (
          !this.id &&
          this.$auth.user?.Id &&
          this.$auth.user?.PrimaryImageTag
        ) {
          return `${this.$axios.defaults.baseURL}/Users/${this.$auth.user.Id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&quality=${this.quality}`;
        } else if (this.id) {
          return `${this.$axios.defaults.baseURL}/Users/${this.id}/Images/Primary/?tag=${this.$auth.user.PrimaryImageTag}&quality=${this.quality}`;
        } else {
          return undefined;
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
