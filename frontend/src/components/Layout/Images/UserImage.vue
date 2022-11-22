<template>
  <div>
    <v-avatar v-if="loading" color="primary" :size="size">
      <v-icon :size="iconSize" dark>mdi-account</v-icon>
    </v-avatar>
    <div
      v-show="!loading"
      ref="img"
      class="user-image"
      :class="{ 'rounded-circle': rounded }" />
  </div>
</template>

<script lang="ts">
import { UserDto } from '@jellyfin/client-axios';
import { defineComponent } from 'vue';

export default defineComponent({
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
    },
    rounded: {
      type: Boolean,
      default: false
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
    /**
     * We're using a div to have a fully centered image for all kind of possible sizes, something that
     * img doesn't allow and we couldn't do before with v-avatar and v-img.
     *
     * v-img also uses a div, so it can be replaced with it, but doesn't emit a 'load'
     * event that allows us to make the switch between the image and the placeholder when v-show is true for it.
     * TODO: This might be a bug upstream that can be reported.
     */
    manageDiv(): void {
      this.loading = true;

      const element = this.$refs.img as HTMLElement;

      element.style.width = `${this.size}px`;
      element.style.height = `${this.size}px`;

      if (element && this.userImage) {
        let img = new Image();

        img.addEventListener('load', (): void => {
          element.style.backgroundImage = 'url(' + img.src + ')';
          this.loading = false;
          // @ts-expect-error - Disposes the object
          img = null;
        });

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
