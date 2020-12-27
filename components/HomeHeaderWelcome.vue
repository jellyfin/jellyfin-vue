<template>
  <div>
    <div ref="homeWelcome" class="swiperContainer">
      <div class="swiper">
        <div class="slide-backdrop" />
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 py-0 py-md-4 align-start"
          >
            <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
              <p class="text-h4 text-sm-h3 text-md-h2 text-lg-h2 text-xl-h2">
                {{
                  $t('homeHeader.welcome.helloUser', {
                    userName: $auth.user.Name
                  })
                }}
              </p>
              <transition name="fade" mode="in-out">
                <h1
                  v-if="extraText"
                  class="text-h4 text-sm-h3 text-md-h2 text-lg-h2 text-xl-h2"
                >
                  {{ extraText }}
                </h1>
              </transition>
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
  }
});
</script>

<style lang="scss" scoped>
@import '~/assets/styles/HomeHeader.scss';
</style>
