import { Context } from '@nuxt/types/app';
import serverMiddleware from '../serverMiddleware';

const mockRedirect = jest.fn();

const BASE_INPUT = ({
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
} as unknown) as Context;

const INPUT_WITH_BASEURL = ({
  ...BASE_INPUT,
  $axios: { defaults: { baseURL: 'test-url' } }
} as unknown) as Context;

const INPUT_WITH_SERVERLIST = ({
  ...BASE_INPUT,
  store: { state: { servers: { serverList: ['item-a'] } } }
} as unknown) as Context;

const INPUT_WITH_BOTH = ({
  ...BASE_INPUT,
  $axios: { defaults: { baseURL: 'test-url' } },
  store: { state: { servers: { serverList: ['item-a'] } } }
} as unknown) as Context;

const EXPECTED_REDIRECT = '/addserver';

afterEach(() => mockRedirect.mockReset());

describe('serverMiddleware', () => {
  it('redirects to "/addserver/ when a baseUrl is not set', (): void => {
    serverMiddleware(BASE_INPUT);

    expect(mockRedirect).toHaveBeenCalled();

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT);
  });

  it('redirects to "/addserver" when the serverlist length is 0', (): void => {
    serverMiddleware(INPUT_WITH_BASEURL);

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT);
  });

  it('redirects to "/addserver" when the baseUrl is undefined', (): void => {
    serverMiddleware(INPUT_WITH_SERVERLIST);

    expect(mockRedirect.mock.calls[0][0]).toBe(EXPECTED_REDIRECT);
  });

  it('does not redirect when a baseUrl is set and a serverlist is defined', (): void => {
    serverMiddleware(INPUT_WITH_BOTH);

    expect(mockRedirect.mock.calls).toHaveLength(0);
  });
});
