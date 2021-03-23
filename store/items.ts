import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import map from 'lodash/map';
import some from 'lodash/some';
import forEach from 'lodash/forEach';

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  allIds: string[];
}

export const defaultState = (): ItemsState => ({
  byId: {},
  allIds: []
});

export const state = defaultState;

export const getters: GetterTree<ItemsState, ItemsState> = {
  getItem: (state) => (id: string): BaseItemDto | undefined => state.byId[id],
  getItems: (state) => (ids: string[]): BaseItemDto[] =>
    map(ids, (id) => state.byId[id])
};

export const mutations: MutationTree<ItemsState> = {
  ADD_ITEM(state: ItemsState, { item }: { item: BaseItemDto }) {
    if (!item.Id) {
      throw new Error("No item ID in provided item, can't store it");
    }

    Vue.set(state.byId, item.Id, item);

    if (!state.allIds.includes(item.Id)) {
      state.allIds.push(item.Id);
    }
  },
  DELETE_ITEM(state: ItemsState, { id }: { id: string }) {
    delete state.byId[id];

    const idx = state.allIds.indexOf(id);

    if (idx > -1) {
      state.allIds.splice(idx, 1);
    }
  },
  CLEAR_STATE(state: ItemsState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<ItemsState, ItemsState> = {
  addItem({ commit }, { item }: { item: BaseItemDto }) {
    commit('ADD_ITEM', { item });
  },
  addItems({ commit }, { items }: { items: BaseItemDto[] }) {
    if (some(items, (item) => !item.Id)) {
      throw new Error('Item missing ID');
    }

    forEach(items, (item) => {
      commit('ADD_ITEM', { item });
    });
  },
  deleteItem({ commit }, { id }: { id: string }) {
    commit('DELETE_ITEM', { id });
  },
  deleteItems({ commit }, { ids }: { ids: string[] }) {
    forEach(ids, (id) => {
      commit('DELETE_ITEM', { id });
    });
  },
  clearState({ commit }) {
    commit('CLEAR_STATE');
  }
};
