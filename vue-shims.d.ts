declare module '*.vue' {
  import Vue from 'vue';

  export default Vue;
}

// Fix the wonky nuxt-auth types for Vuex stores
declare module 'vuex/types/index' {
  import { Auth } from '@nuxtjs/auth';

  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $auth: Auth;
  }
}
