<template>
  <v-avatar color="primary" :size="size">
    <v-img
      :src="userImage"
      :alt="user ? user.Name : undefined"
      class="userImage"
    >
      <template #placeholder>
        <v-icon :size="size - 32" dark>mdi-account</v-icon>
      </template>
    </v-img>
  </v-avatar>
</template>

<script lang="ts">
import { UserDto } from '@jellyfin/client-axios';
import Vue from 'vue';

export default Vue.extend({
  props: {
    user: {
      type: Object as () => UserDto,
      required: true
    },
    size: {
      type: Number,
      required: false,
      default: 64
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
        if (this.user?.Id && this.user?.PrimaryImageTag) {
          return `${this.$axios.defaults.baseURL}/Users/${this.user.Id}/Images/Primary/?tag=${this.user.PrimaryImageTag}&quality=${this.quality}`;
        } else {
          return undefined;
        }
      }
    }
  }
});
</script>
