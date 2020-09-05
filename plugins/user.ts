import { Context } from '@nuxt/types';
import { PluginInjection } from '~/types/utils';

interface UserStore {
  set: (id: string, serverUrl: string, accessToken: string) => void;
  clear: () => void;
}

declare module '@nuxt/types' {
  interface Context {
    $user: UserStore;
  }

  interface NuxtAppOptions {
    $user: UserStore;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $user: UserStore;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $user: UserStore;
  }
}

export default (context: Context, inject: PluginInjection): void => {
  const user = {
    set: (id: string, serverUrl: string, accessToken: string) => {
      context.store.commit('user/set', { id, serverUrl, accessToken });
    },
    clear: () => {
      context.store.commit('user/clear');
    }
  };

  inject('user', user);
};
