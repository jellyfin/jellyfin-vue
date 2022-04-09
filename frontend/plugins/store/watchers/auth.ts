import { Context } from '@nuxt/types';
import {
  authStore,
  clientSettingsStore,
  homeSectionStore,
  itemsStore,
  pageStore,
  playbackManagerStore,
  snackbarStore,
  socketStore,
  userViewsStore
} from '~/store';
import { authLogic } from '~/middleware/auth';

/**
 * Authentication logic on app runtime
 *
 * The logic to handle logouts and user switches during initialization lives inside Nuxt's auth plugin (~/plugins/nuxt/auth)
 *
 * @param ctx
 */
export default function watchAuth(ctx: Context): void {
  const auth = authStore();
  const clientSettings = clientSettingsStore();
  const homeSection = homeSectionStore();
  const snackbar = snackbarStore();
  const page = pageStore();
  const socket = socketStore();
  const userViews = userViewsStore();
  const items = itemsStore();
  const playbackManager = playbackManagerStore();

  /**
   * Watch for actions after the app has been initialized
   */
  auth.$onAction(({ name, after, store }) => {
    after(async () => {
      if (
        name !== 'authInit' &&
        name !== 'setAxiosHeader' &&
        name !== 'setAxiosBaseUrl'
      ) {
        /**
         * We set the useContext boolean to false since at this point the app will be already booted, so
         * we need to stick to Vue Router to avoid conflicts.
         */
        authLogic(ctx, auth, false);

        if (name === 'logoutUser' && store.currentUserIndex === -1) {
          clientSettings.$reset();
          homeSection.$reset();
          snackbar.$reset();
          page.$reset();
          socket.closeSocket();
          userViews.$reset();
          items.$reset();
          playbackManager.$reset();
        }

        if (name === 'loginUser') {
          await clientSettings.initState();
          socket.connectUserWebSocket();
        }
      }
    });
  });
}
