<template>
  <div>
    <v-avatar v-if="loading" color="primary" :size="size">
      <v-icon :size="iconSize" dark>mdi-account</v-icon>
    </v-avatar>
    <div v-show="!loading" ref="img" class="user-image" />
  </div>
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
  data() {
    return {
      loading: true
    };
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
    },
    iconSize(): number {
      return this.size * 0.75;
    }
  },
  /**
   * We need to verify that the component is mounted before setting up the div's background
   */
  watch: {
    userImage() {
      this.manageDiv();
    },
    size() {
      this.manageDiv();
    }
  },
  mounted() {
    this.manageDiv();
  },
  methods: {
    manageDiv(): void {
      this.loading = true;

      const elem = this.$refs.img as HTMLElement;

      elem.style.width = `${this.size}px`;
      elem.style.height = `${this.size}px`;

      if (elem && this.userImage) {
        let img = new Image();

        img.onload = (): void => {
          elem.style.backgroundImage = 'url(' + img.src + ')';
          this.loading = false;
          // @ts-expect-error - Disposes the object
          img = null;
        };

        img.src = this.userImage;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.user-image {
  background-size: cover;
  background-position: center center;
}
</style>
