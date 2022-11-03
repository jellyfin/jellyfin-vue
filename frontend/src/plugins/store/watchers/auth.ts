import { PiniaPluginContext } from 'pinia';
import {
  authStore,
  clientSettingsStore,
  homeSectionStore,
  itemsStore,
  pageStore,
  playbackManagerStore,
  snackbarStore,
  socketStore,
  userViewsStore,
  taskManagerStore
} from '@/store';
import { authLogic } from '@/middleware/auth';

/**
 * Authentication logic on app runtime
 *
 * The logic to handle logouts and user switches during initialization lives inside Nuxt's auth plugin (~/plugins/nuxt/auth)
 *
 */
export default function (ctx: PiniaPluginContext): void {
  const auth = authStore();
  const clientSettings = clientSettingsStore();
  const homeSection = homeSectionStore();
  const snackbar = snackbarStore();
  const page = pageStore();
  const socket = socketStore();
  const userViews = userViewsStore();
  const items = itemsStore();
  const playbackManager = playbackManagerStore();
  const taskManager = taskManagerStore();

  /**
   * Watch for actions after the app has been initialized
   */
  auth.$onAction(({ name, after }) => {
    after(async () => {
      if ((auth.currentUser && name === 'authInit') || name === 'loginUser') {
        // Get user info, either at already logged in app start or when manually login in
        userViews.refreshUserViews();
      }

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

        if (name === 'logoutCurrentUser') {
          clientSettings.$reset();
          homeSection.$reset();
          snackbar.$reset();
          page.$reset();
          socket.closeSocket();
          userViews.$reset();
          items.$reset();
          playbackManager.$reset();
          taskManager.$reset();
        }

        if (name === 'loginUser') {
          await clientSettings.initState();
          socket.connectUserWebSocket();
        }
      }
    });
  });
}
