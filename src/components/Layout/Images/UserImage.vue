<template>
  <v-avatar color="primary" :size="size">
    <v-img :src="userImage" :alt="user.Name" class="userImage">
      <template #placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-icon :size="size - 12" dark>mdi-account</v-icon>
        </v-row>
      </template>
    </v-img>
  </v-avatar>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { UserDto } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    user: {
      type: Object as PropType<UserDto>,
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
