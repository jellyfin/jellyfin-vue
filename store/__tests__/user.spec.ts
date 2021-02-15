import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store, ActionContext } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, UserState, defaultState, actions } from '../user';
import { RootState } from '~/store';
import type { ModuleAction } from '~/jest-helpers.d.ts';
import { TEST_ACCESS_TOKEN } from '~/mocks/auth';

let localVue: VueConstructor<Vue>;
let store: Store<UserState>;
let mockCommit: jest.Mock;
let mockDispatch: jest.Mock;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));

  mockCommit = jest.fn();
  mockDispatch = jest.fn();
});

afterEach((): void => {
  mockCommit.mockReset();
  mockDispatch.mockReset();
});

describe('Vuex: user', () => {
  it('sets the access token when SET_USER is commited', (): void => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_USER', { accessToken: TEST_ACCESS_TOKEN });

    expect(store.state.accessToken).toBe(TEST_ACCESS_TOKEN);
  });

  it('clear the access token when CLEAR_USER is commited', (): void => {
    store.replaceState({ ...defaultState(), accessToken: TEST_ACCESS_TOKEN });

    store.commit('CLEAR_USER');

    expect(store.state.accessToken).toBe('');
  });

  it('calls the SET_USER mutation when setUser is dispatched', (): void => {
    const setUser = (actions.setUser as unknown) as ModuleAction<UserState>;

    setUser(
      ({ commit: mockCommit } as unknown) as ActionContext<
        UserState,
        RootState
      >,
      {
        accessToken: TEST_ACCESS_TOKEN
      }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toEqual('SET_USER');
    expect(mockCommit.mock.calls[0][1]).toEqual({
      accessToken: TEST_ACCESS_TOKEN
    });
  });

  it('calls the CLEAR_USER mutation when clearUser is dispatched', (): void => {
    const clearUser = (actions.clearUser as unknown) as ModuleAction<UserState>;

    clearUser(
      ({ commit: mockCommit } as unknown) as ActionContext<
        UserState,
        RootState
      >,
      {}
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toEqual('CLEAR_USER');
    expect(mockCommit.mock.calls[0][1]).toBeUndefined();
  });

  // TODO: Figure out why mockDispatch never gets called
  /*
  it('dispatches setUser when loginRequest is dispatched and succeeds', (): void => {
    let loginRequest = (actions.loginRequest as unknown) as ModuleAction<UserState>;
    loginRequest = loginRequest.bind({ $auth, $axios });

    loginRequest(
      ({
        commit: mockCommit,
        dispatch: mockDispatch
      } as unknown) as ActionContext<UserState, RootState>,
      {
        username: 'lorem',
        password: 'ipsum',
        rememberMe: true
      }
    );

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockDispatch.mock.calls[0][0]).toEqual('setUser');
    expect(mockDispatch.mock.calls[0][1]).toBe({
      accessToken: TEST_ACCESS_TOKEN
    });
  });
  */
});
