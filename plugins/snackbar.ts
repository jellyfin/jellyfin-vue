import { Context } from '@nuxt/types';

declare module '@nuxt/types' {
  interface Context {
    $snackbar(message: string, color: string): void;
  }

  interface NuxtAppOptions {
    $snackbar(message: string, color: string): void;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $snackbar(message: string, color: string): void;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $snackbar(message: string, color: string): void;
  }
}

export default (context: Context, inject: Function) => {
  inject('snackbar', (message: string, color: string | undefined | null) => {
    context.store.commit('snackbar/display', { message, color });
  });
};
