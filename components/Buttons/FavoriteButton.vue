<template>
  <v-btn :absolute="absolute" icon @click.stop.prevent="toggleFavorite">
    <v-icon medium :class="fav ? 'red--text' : ''">
      {{ fav ? 'mdi-heart' : 'mdi-heart-outline' }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    absolute: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fav: false
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        if (this.item.UserData?.IsFavorite) {
          this.fav = this.item.UserData.IsFavorite;
        }
      }
    }
  },
  methods: {
    async toggleFavorite(): Promise<void> {
      if (this.item.Id) {
        if (!this.fav) {
          await this.$nuxt.$api.userLibrary.markFavoriteItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id
          });
          this.fav = true;
        } else {
          await this.$nuxt.$api.userLibrary.unmarkFavoriteItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id
          });
          this.fav = false;
        }
      }
    }
  }
});
</script>
