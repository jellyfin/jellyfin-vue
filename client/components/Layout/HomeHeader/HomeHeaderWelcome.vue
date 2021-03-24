<template>
  <div>
    <div ref="homeWelcome" class="swiperContainer">
      <div class="swiper">
        <div class="slide-backdrop" />
        <div class="slide-content">
          <v-container
            fill-height
            class="mx-md-10 mt-md-5 mt-10 py-0 py-md-4 align-start justify-center text-center text-md-left justify-md-start"
          >
            <v-col cols="12" sm="8" md="6" xl="5" class="py-0 py-md-4">
              <p
                v-if="$auth.user"
                class="text-h6 text-sm-h4 text-md-h2 text-lg-h2 text-xl-h2"
              >
                {{
                  $t('homeHeader.welcome.helloUser', {
                    userName: $auth.user.Name
                  })
                }}
              </p>
              <v-fade-transition>
                <h1
                  v-if="extraText"
                  class="text-h6 text-sm-h4 text-md-h2 text-lg-h2 text-xl-h2"
                >
                  {{ extraText }}
                </h1>
              </v-fade-transition>
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
