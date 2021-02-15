export const TEST_ACCESS_TOKEN = 'lorem-ipsum-dolor-sit-amet';

const $auth = {
  loginWith: (_strategyName: string, ..._args: never): Promise<never> => {
    return Promise.resolve({
      data: {
        AccessToken: TEST_ACCESS_TOKEN
      }
    }) as Promise<never>;
  }
};

export default $auth;
