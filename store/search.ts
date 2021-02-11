import { ActionTree, MutationTree } from 'vuex';

export interface SearchState {
  query: string;
}

const defaultState = (): SearchState => ({
  query: ''
});

export const state = defaultState;

interface SearchMutationPayload {
  query: string;
}

export const mutations: MutationTree<SearchState> = {
  SET_SEARCH_QUERY(state: SearchState, { query }: SearchMutationPayload) {
    state.query = query;
  },
  RESET_SEARCH(state: SearchState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<SearchState, SearchState> = {
  setSearchQuery({ commit }, { query }: SearchMutationPayload) {
    commit('SET_SEARCH_QUERY', { query });
  },
  resetSearch({ commit }) {
    commit('RESET_SEARCH');
  }
};
