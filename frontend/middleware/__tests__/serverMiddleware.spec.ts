import { Context } from '@nuxt/types/app';
import serverMiddleware from '../serverMiddleware';

const mockRedirect = jest.fn();

const BASE_INPUT = {
  $axios: {
    defaults: {
      baseURL: ''
    }
  },
  store: {
    state: {
      servers: {
        serverList: []
      }
    }
  },
  redirect: mockRedirect
} as unknown as Context;

const INPUT_WITH_NO_SERVER_LIST = {
  ...BASE_INPUT,
  store: { state: { servers: { serverList: [] } } }
} as unknown as Context;

const INPUT_WITH_SERVER_LIST = {
  ...BASE_INPUT,
  $axios: { defaults: { baseURL: 'test-url' } },
  store: { state: { servers: { serverList: ['item-a'] } } }
} as unknown as Context;

const INPUT_WITH_MULTISERVERLIST = {
  ...BASE_INPUT,
  $axios: { defaults: { baseURL: 'test-url' } },
  store: { state: { servers: { serverList: ['item-a', 'item-b'] } } }
} as unknown as Context;

const EXPECTED_REDIRECT = '/server/add';
const EXPECTED_REDIRECT_SELECT = '/server/select';

afterEach(() => mockRedirect.mockReset());

describe('serverMiddleware', () => {
  it('redirects to "/server/add" when a baseUrl is not set', (): void => {
    serverMiddleware(BASE_INPUT);

    expect(mockRedirect).toHaveBeenCalled();

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT);
  });

  it('redirects to "/server/add" when baseUrl is set the serverlist length is zero', (): void => {
    serverMiddleware(INPUT_WITH_NO_SERVER_LIST);

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT);
  });

  it('does not redirect when the baseUrl is set and server list length is 1', (): void => {
    serverMiddleware(INPUT_WITH_SERVER_LIST);

    expect(mockRedirect.mock.calls).toHaveLength(0);
  });

  it('redirect to "/server/select" when a baseUrl is set and a serverlist with more than 1 server is defined', (): void => {
    serverMiddleware(INPUT_WITH_MULTISERVERLIST);

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT_SELECT);
  });
});
