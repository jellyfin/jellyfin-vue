import { UserDto } from '@jellyfin/client-axios';
import { Context, Inject, Plugin } from '@nuxt/types/app';
import { authStore } from '~/store';
import { setHeaderAndBaseUrl } from '~/middleware/auth';

/**
 * TypeScript types
 */
type AuthType = {
  user: UserDto;
};

declare module '@nuxt/types' {
  interface Context {
    $auth: AuthType;
  }

  interface NuxtAppOptions {
    $auth: AuthType;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $auth: AuthType;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $auth: AuthType;
  }
}

const authPlugin: Plugin = (ctx: Context, inject: Inject) => {
  const auth = authStore();

  /**
   * Logout the user on app initialization if the user doesn't want to be remembered.
   *
   * The logic to handle logouts and user switches during runtime lives inside Pinia watchers (~/plugins/store/watchers/auth)
   * Middleware lives at ~/middleware/auth
   */
  if (!auth.rememberMe) {
    setHeaderAndBaseUrl(ctx, auth);
    auth.logoutUser();
  }

  inject('auth', {
    user: auth.getCurrentUser
  });
};

export default authPlugin;
