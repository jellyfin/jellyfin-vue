<template>
  <div>
    <div ref="homeWelcome" class="swiperContainer">
      <div class="swiper">
        <div class="slide-backdrop" />
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 py-0 py-md-4 align-end align-sm-center align-md-start"
          >
            <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
              <v-row>
                <h1 class="text-h2 mb-2 align-center">Hello {{ userName }}!</h1>
              </v-row>
              <v-row>
                <transition name="fade" mode="in-out">
                  <h1 v-if="extraText" class="text-h2 mb-2 align-center">
                    {{ extraText }}
                  </h1>
                </transition>
              </v-row>
            </v-col>
          </v-container>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    extraText: {
      type: String,
      required: false,
      default: undefined
    }
  },
  computed: {
    userName: {
      get(): string {
        return this.$auth.user.Name;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.text-h2,
.text-h4 {
  line-height: normal;
}

.swiperContainer {
  min-width: 100%;
  min-height: 100%;
  position: relative;
  user-select: none;
}

.slide-backdrop {
  padding-bottom: 80%;
  z-index: 1;
}

.slide-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  z-index: 2;
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .slide-backdrop {
    padding-bottom: 46.25%;
  }

  .swiper {
    margin-top: -64px;
  }

  .slide-content {
    top: 56px;
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .swiper {
    margin-bottom: -128px !important;
  }
}
</style>
