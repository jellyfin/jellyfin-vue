import Vue from 'vue';
import { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/client-axios';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import some from 'lodash/some';
import union from 'lodash/union';

interface ItemsByType {
  Type: string;
  Items: BaseItemDto[];
}

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  allIds: readonly string[];
  boxSetChildrenById: Record<string, ItemsByType[]>;
}

export const defaultState = (): ItemsState => ({
  byId: {},
  allIds: [],
  boxSetChildrenById: {}
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
      map(ids, (id) => state.byId[id]),
  getBoxsetChildren:
    (state) =>
    (id: string): ItemsByType[] =>
      state.boxSetChildrenById[id]
};

type AddBoxsetChildrenMutationPayload = {
  childrenList: BaseItemDto[];
  itemId?: string;
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
  ADD_BOXSET_CHILDREN(state: ItemsState, { childrenList, itemId }) {
    if (!itemId) {
      throw new Error('itemId is undefined');
    }

    if (!childrenList) return [];
    //  Error('childrenList is undefined');

    const children: { [key: string]: BaseItemDto[] } = {};

    childrenList.forEach((item: BaseItemDto) => {
      if (item.Type && typeof item.Type === 'string') {
        if (!children[item.Type]) children[item.Type] = [];

        children[item.Type].push(item);
      }
    });

    const perTypeList: ItemsByType[] = Object.keys(children).map((type) => {
      return { Type: type, Items: children[type] };
    });

    const perTypeOrderedList: ItemsByType[] = perTypeList.sort(
      (a, b) => b.Items.length - a.Items.length
    );

    Vue.set(state.boxSetChildrenById, itemId, perTypeOrderedList || []);
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
  async fetchBoxsetChildren({ dispatch }, { itemId }: { itemId: string }) {
    try {
      const { data } = await this.$api.items.getItems({
        userId: this.$auth.user?.Id,
        parentId: itemId
      });

      dispatch('fetchBoxsetChildrenSuccess', {
        response: data,
        itemId
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch('fetchBoxsetChildrenFailure', error);
    }
  },
  fetchBoxsetChildrenSuccess(
    { commit },
    {
      response,
      itemId
    }: {
      response: BaseItemDtoQueryResult;
      itemId: string;
    }
  ) {
    commit('ADD_BOXSET_CHILDREN', {
      childrenList: response.Items,
      itemId
    } as AddBoxsetChildrenMutationPayload);
  },
  fetchBoxsetChildrenFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  clearState({ commit }) {
    commit('CLEAR_STATE');
  }
};
