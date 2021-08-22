import { Context } from '@nuxt/types';
import adminMiddleware from '../adminMiddleware';

const mockRedirect = jest.fn();

const BASE_INPUT = {
  $auth: {
    user: {
      Policy: {
        IsAdministrator: false
      }
    }
  },
  redirect: mockRedirect
} as unknown as Context;

const INPUT_NOT_ADMIN = {
  ...BASE_INPUT
};

const INPUT_ADMIN = {
  ...BASE_INPUT,
  $auth: {
    user: {
      Policy: {
        IsAdministrator: true
      }
    }
  }
} as unknown as Context;

afterEach(() => mockRedirect.mockReset());

describe('adminMiddleware', () => {
  it('redirects to "/" when user is not an administrator', (): void => {
    adminMiddleware(INPUT_NOT_ADMIN);

    expect(mockRedirect.mock.calls[0][0]).toBe('/');
  });

  it('does not redirect when user is not an administrator', (): void => {
    adminMiddleware(INPUT_ADMIN);

    expect(mockRedirect.mock.calls).toHaveLength(0);
  });
});
