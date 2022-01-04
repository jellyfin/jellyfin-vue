import Vuex, { ActionContext, Store } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import { state, mutations, actions, UserState, defaultState } from '../user';
import { AppState } from '..';
import { ModuleAction } from '~/jest-helpers.d';

let store: Store<UserState>;
let mockCommit: jest.Mock;

const TEST_ACCESS_TOKEN = 'test-access-token';

beforeEach(() => {
  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));

  mockCommit = jest.fn();
});

afterEach((): void => {
  mockCommit.mockReset();
});

describe('Vuex: user store', () => {
  it('sets the access token when "SET_USER" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_USER', { accessToken: TEST_ACCESS_TOKEN });

    expect(store.state.accessToken).toBe(TEST_ACCESS_TOKEN);
  });

  it('clears the access token When "CLEAR_USER" is committed', () => {
    store.replaceState({ ...defaultState(), accessToken: TEST_ACCESS_TOKEN });

    store.commit('CLEAR_USER');

    expect(store.state).toMatchObject(defaultState());
  });

  it('calls the SET_USER mutation when setUser is dispatched', () => {
    const setUser = actions.setUser as unknown as ModuleAction<UserState>;

    setUser(
      { commit: mockCommit } as unknown as ActionContext<UserState, AppState>,
      { accessToken: TEST_ACCESS_TOKEN }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('SET_USER');
    expect(mockCommit.mock.calls[0][1]).toMatchObject({
      accessToken: TEST_ACCESS_TOKEN
    });
  });

  it('calls the CLEAR_USER mutation when clearUser is dispatched', () => {
    const clearUser = actions.clearUser as unknown as ModuleAction<UserState>;

    clearUser(
      { commit: mockCommit } as unknown as ActionContext<UserState, AppState>,
      {}
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('CLEAR_USER');
  });
});
