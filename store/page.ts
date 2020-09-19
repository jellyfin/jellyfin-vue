import { MutationTree } from 'vuex';

export interface PageState {
  title: string;
}

export const state = (): PageState => ({
  title: 'Jellyfin'
});

interface MutationPayload {
  title: string;
}

export const mutations: MutationTree<PageState> = {
  setTitle(state: PageState, payload: MutationPayload) {
    state.title = payload.title;
  }
};
