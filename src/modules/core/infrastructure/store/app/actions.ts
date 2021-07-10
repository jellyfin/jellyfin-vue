import { ActionTree } from 'vuex';
import { RootState } from '~/plugins/vuex';
import { AppState } from '.';
import { CoreMutations } from './mutations';

const actions: ActionTree<AppState, RootState> = {
  async reset({ dispatch }, { clearCritical }: { clearCritical: boolean }) {
    // TODO: Refactor this. It shouldn't be happening here, especially with the new architecture.

    const promises = [];

    promises.push(dispatch('backdrop/clearAllBackdrop', { root: true }));
    promises.push(dispatch('clientSettings/resetState', { root: true }));
    promises.push(dispatch('homeSection/clearHomeSection', { root: true }));
    promises.push(dispatch('items/clearState', { root: true }));
    promises.push(dispatch('page/clearPage', { root: true }));
    promises.push(dispatch('playbackManager/stop', { root: true }));
    promises.push(dispatch('snackbar/resetMessage', { root: true }));
    promises.push(dispatch('tvShows/clearTvShows', { root: true }));
    promises.push(dispatch('user/clearUser', { root: true }));
    promises.push(dispatch('userViews/clearUserViews', { root: true }));

    if (clearCritical) {
      promises.push(dispatch('servers/clearServers', { root: true }));
    }

    await Promise.all(promises);
  },
  setSyncStatus({ commit }, value: boolean) {
    commit(CoreMutations.SetSyncStatus, value);
  },
  setPageTitle({ commit }, title: boolean) {
    commit(CoreMutations.SetPageTitle, title);
  },
  setAppBarOpacity({ commit }, opaqueAppBar: boolean) {
    commit(CoreMutations.SetBarOpacity, opaqueAppBar);
  },
  showNavDrawer({ commit }, showNavDrawer: boolean) {
    commit(CoreMutations.SetNavigationDrawerOpacity, showNavDrawer);
  }
};

export default actions;
