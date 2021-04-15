import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import some from 'lodash/some';
import union from 'lodash/union';

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  allIds: readonly string[];
}

export const defaultState = (): ItemsState => ({
  byId: {},
  allIds: []
});

export const state = defaultState;

export const getters: GetterTree<ItemsState, ItemsState> = {
  getItem:
    (state) =>
    (id: string): BaseItemDto | undefined =>
      state.byId[id],
  getItems:
    (state) =>
    (ids: string[]): BaseItemDto[] =>
      map(ids, (id) => state.byId[id])
};

export const mutations: MutationTree<ItemsState> = {
  ADD_ITEM(state: ItemsState, { item }: { item: BaseItemDto }) {
    if (!item.Id) {
      throw new Error('No item ID provided');
    }

    const newAllIds = Array.from(state.allIds);

    Vue.set(state.byId, item.Id, item);

    if (!newAllIds.includes(item.Id)) {
      newAllIds.push(item.Id);
      state.allIds = Object.freeze(newAllIds);
    }
  },
  ADD_ITEMS(state: ItemsState, { items }: { items: BaseItemDto }) {
    let newById = Object.assign({}, state.byId);
    let newAllIds = Array.from(state.allIds);

    newById = merge(newById, items);

    state.byId = newById;

    newAllIds = union(newAllIds, Object.keys(items));
    state.allIds = Object.freeze(newAllIds);
  },
  DELETE_ITEM(state: ItemsState, { id }: { id: string }) {
    delete state.byId[id];

    const idx = state.allIds.indexOf(id);

    if (idx > -1) {
      const newAllIds = Array.from(state.allIds);

      newAllIds.splice(idx, 1);
      state.allIds = Object.freeze(newAllIds);
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
      throw new Error('An item is missing an ID.');
    }

    const mappedItems = keyBy(items, 'Id');

    commit('ADD_ITEMS', { items: mappedItems });
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
