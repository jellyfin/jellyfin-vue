import isNil from 'lodash/isNil';
import { RouteLocationRaw } from 'vue-router';
import { useRemote } from '@/composables';

const serverAddUrl = '/server/add';
const serverSelectUrl = '/server/select';
const serverLoginUrl = '/server/login';
const remote = useRemote();

/**
 * Redirects to login page if there's no user logged in.
 */
export default function loginGuard(): boolean | RouteLocationRaw {
  if (remote.auth.servers.value.length <= 0) {
    return { name: serverAddUrl, replace: true };
  } else if (isNil(remote.auth.currentServer.value)) {
    return { name: serverSelectUrl, replace: true };
  } else if (isNil(remote.auth.currentUser.value)) {
    return { name: serverLoginUrl, replace: true };
  }

  return true;
}
