import Vue from 'vue';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/client-axios';

export interface CollectionItem {
  /**
   * children: All the items that belongs to the collection ciao
   */
  children: { Type: string; Items: BaseItemDto[] }[];
}

export interface CollectionsState {
  [key: string]: CollectionItem;
}

export const defaultState = (): CollectionsState => ({});

export const state = defaultState;

type AddChildrenMutationPayload = {
  children: { Type: string; Items: BaseItemDto[] }[];
  itemId?: string;
};

export const getters: GetterTree<CollectionsState, CollectionsState> = {
  getChildren:
    (state) =>
    (itemId: string): CollectionItem['children'] => {
      return state[itemId]?.children || [];
    }
};

export const mutations: MutationTree<CollectionsState> = {
  ADD_COLLECTION_CHILDREN(
    state: CollectionsState,
    { children, itemId }: AddChildrenMutationPayload
  ) {
    if (!itemId) {
      throw new Error('itemId is undefined');
    }

    Vue.set(state, itemId, {
      children: children || {}
    });
  },
  CLEAR_CHILDREN(state: CollectionsState) {
    Object.assign(state, defaultState());
  }
};
export const actions: ActionTree<CollectionsState, CollectionsState> = {
  async getCollectionChildren({ dispatch }, { itemId }: { itemId: string }) {
    try {
      const { data } = await this.$api.items.getItems({
        userId: this.$auth.user?.Id,
        parentId: itemId
      });

      dispatch('getCollectionChildrenSuccess', {
        response: data,
        itemId
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch('getCollectionChildrenFailure', error);
    }
  },
  getCollectionChildrenSuccess(
    { commit },
    {
      response,
      itemId
    }: {
      response: BaseItemDtoQueryResult;
      itemId: string;
    }
  ) {
    const children: { [key: string]: BaseItemDto[] } = {};

    response.Items?.forEach((item: BaseItemDto) => {
      if (item.Type && typeof item.Type === 'string') {
        if (!children[item.Type]) children[item.Type] = [];

        children[item.Type].push(item);
      }
    });

    const perTypeList = Object.keys(children).map((type) => {
      return { Type: type, Items: children[type] };
    });

    const perTypeOrderedList = perTypeList.sort(
      (a, b) => b.Items.length - a.Items.length
    );

    commit('ADD_COLLECTION_CHILDREN', {
      children: perTypeOrderedList,
      itemId
    } as AddChildrenMutationPayload);
  },
  getCollectionChildrenFailure: async ({ dispatch }, error) => {
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
  clearChildren({ commit }) {
    commit('CLEAR_CHILDREN');
  }
};
