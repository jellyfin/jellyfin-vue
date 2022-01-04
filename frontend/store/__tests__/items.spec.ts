import Vuex, { Store, ActionContext } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import cloneDeep from 'lodash/cloneDeep';
import { AppState } from '..';
import {
  state,
  mutations,
  ItemsState,
  defaultState,
  actions,
  getters
} from '../items';
import type { ModuleAction } from '~/jest-helpers.d';

let store: Store<ItemsState>;
let mockCommit: jest.Mock;
let mockDispatch: jest.Mock;

let addItem: ModuleAction<ItemsState>;
let addItems: ModuleAction<ItemsState>;
let deleteItem: ModuleAction<ItemsState>;
let deleteItems: ModuleAction<ItemsState>;
let clearState: ModuleAction<ItemsState>;

const id1 = 'ID';
const name1 = 'Movie 1';
const item1: BaseItemDto = { Id: id1, Name: name1 };

const id2 = 'ID2';
const name2 = 'Movie 2';
const item2: BaseItemDto = { Id: id2, Name: name2 };

const name1Bis = 'Movie 1Bis';
const item1Bis: BaseItemDto = { Id: id1, Name: name1Bis };

const itemInvalid: BaseItemDto = {};

beforeEach(() => {
  store = new Vuex.Store(cloneDeep({ state, mutations, actions, getters }));
  addItem = actions.addItem as unknown as ModuleAction<ItemsState>;
  addItems = actions.addItems as unknown as ModuleAction<ItemsState>;
  deleteItem = actions.deleteItem as unknown as ModuleAction<ItemsState>;
  deleteItems = actions.deleteItems as unknown as ModuleAction<ItemsState>;
  clearState = actions.clearState as unknown as ModuleAction<ItemsState>;

  mockCommit = jest.fn();
  mockDispatch = jest.fn();
});

afterEach((): void => {
  mockCommit.mockReset();
  mockDispatch.mockReset();
});

describe('Vuex: items', () => {
  it('adds an item when ADD_ITEM is commited with valid ID', (): void => {
    store.replaceState({ ...defaultState() });

    store.commit('ADD_ITEM', { item: item1 });

    expect(store.state.byId[id1]).toBe(item1);
    expect(store.state.allIds).toHaveLength(1);
    expect(store.state.allIds[0]).toBe(id1);
  });

  it('updates an item when ADD_ITEM is commited with valid and already set ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    store.commit('ADD_ITEM', { item: item1Bis });

    expect(store.state.byId[id1]).toBe(item1Bis);
    expect(store.state.allIds).toHaveLength(1);
    expect(store.state.allIds[0]).toBe(id1);
  });

  it('throws when ADD_ITEM is commited with invalid ID', (): void => {
    store.replaceState({ ...defaultState() });

    expect(() => {
      store.commit('ADD_ITEM', { item: itemInvalid });
    }).toThrow();
    expect(store.state.allIds).toHaveLength(0);
  });

  it('deletes the given ID when DELETE_ITEM is commited with present ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    store.commit('DELETE_ITEM', { id: id1 });

    expect(store.state.byId[id1]).toBeUndefined();
    expect(store.state.allIds).toHaveLength(0);
  });

  it('deletes nothing when DELETE_ITEM is commited with non present ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    store.commit('DELETE_ITEM', { id: 'randomId' });

    expect(store.state.byId[id1]).toBe(item1);
    expect(store.state.allIds).toHaveLength(1);
    expect(store.state.allIds[0]).toBe(id1);
  });

  it('clears the state when CLEAR_STATE is commited', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    store.commit('CLEAR_STATE');

    expect(store.state.byId[id1]).toBeUndefined();
    expect(store.state.allIds).toHaveLength(0);
  });

  it('gets the wanted item when getting a present ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    const res = store.getters.getItem(id1);

    expect(res).toBe(item1);
  });

  it('gets undefined when getting a non present ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1 },
      allIds: [id1]
    });

    const res = store.getters.getItem('weirdId');

    expect(res).toBeUndefined();
  });

  it('gets wanted items when getting a list of ID', (): void => {
    store.replaceState({
      ...defaultState(),
      byId: { [id1]: item1, [id2]: item2 },
      allIds: [id1, id2]
    });

    const res1: Record<string, BaseItemDto> = store.getters.getItems([
      id2,
      id1,
      'unknown'
    ]);
    const res2: Record<string, BaseItemDto> = store.getters.getItems([
      'unknown',
      id2
    ]);

    expect(res1[0]).toBe(item2);
    expect(res1[1]).toBe(item1);
    expect(res1[2]).toBeUndefined();

    expect(res2[0]).toBeUndefined();
    expect(res2[1]).toBe(item2);
  });

  it('calls the ADD_ITEM mutation when addItem is dispatched with a valid item', async (): Promise<void> => {
    await addItem(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {
        item: item1
      }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('ADD_ITEM');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      item: item1
    });
  });

  it('calls the ADD_ITEM mutation when addItem is dispatched with an invalid item', async (): Promise<void> => {
    await addItem(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {
        item: itemInvalid
      }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('ADD_ITEM');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      item: itemInvalid
    });
  });

  it('calls the ADD_ITEM mutation only 1 time when addItems is dispatched with valid items', async (): Promise<void> => {
    await addItems(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {
        items: [item1, item2]
      }
    );

    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockCommit.mock.calls[0][0]).toBe('ADD_ITEMS');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      items: { ID: item1, ID2: item2 }
    });
  });

  it("doesn't call the ADD_ITEM mutation when addItems is dispatched with an invalid item and throws", (): void => {
    expect(() => {
      addItems(
        { commit: mockCommit } as unknown as ActionContext<
          ItemsState,
          AppState
        >,
        {
          items: [item1, item2, itemInvalid]
        }
      );
    }).toThrow();
    expect(mockCommit).toHaveBeenCalledTimes(0);
  });

  it('calls the DELETE_ITEM mutation when deleteItem is dispatched with an ID', async (): Promise<void> => {
    await deleteItem(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {
        id: id1
      }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('DELETE_ITEM');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      id: id1
    });
  });

  it('calls the DELETE_ITEM mutation n times when deleteItems is dispatched with IDs', async (): Promise<void> => {
    await deleteItems(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {
        ids: [id1, id2, 'unknown']
      }
    );

    expect(mockCommit).toHaveBeenCalledTimes(3);
    expect(mockCommit.mock.calls[0][0]).toBe('DELETE_ITEM');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      id: id1
    });
    expect(mockCommit.mock.calls[1][0]).toBe('DELETE_ITEM');
    expect(mockCommit.mock.calls[1][1]).toEqual({
      id: id2
    });
    expect(mockCommit.mock.calls[2][0]).toBe('DELETE_ITEM');
    expect(mockCommit.mock.calls[2][1]).toEqual({
      id: 'unknown'
    });
  });

  it('calls the CLEAR_STATE mutation when clearState is dispatched', async (): Promise<void> => {
    await clearState(
      { commit: mockCommit } as unknown as ActionContext<ItemsState, AppState>,
      {}
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('CLEAR_STATE');
  });
});
