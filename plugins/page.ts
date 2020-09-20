import { Plugin } from '@nuxt/types';

interface PageStore {
  setTitle: (titme: string) => void;
}

declare module '@nuxt/types' {
  interface Context {
    $page: PageStore;
  }

  interface NuxtAppOptions {
    $page: PageStore;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $page: PageStore;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $page: PageStore;
  }
}

const pagePlugin: Plugin = (context, inject) => {
  const page = {
    setTitle: (title: string) => {
      context.store.commit('page/setTitle', {
        title
      });
    }
  };

  inject('page', page);
};

export default pagePlugin;
