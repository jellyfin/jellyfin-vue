import { afterEach, describe, expect, test, vi } from 'vitest';
import { withTimeout } from '../src/universal/promises.ts';

describe('withTimeout: a promise, or a fallback when it takes too long', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('a promise that settles in time gives its value', async () => {
    await expect(withTimeout(Promise.resolve('value'), 1000, 'fallback')).resolves.toBe('value');
  });

  test('a promise that takes longer gives the fallback once the time is up', async () => {
    vi.useFakeTimers();

    const { promise } = Promise.withResolvers<string>();
    const result = withTimeout(promise, 1000, 'fallback');

    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe('fallback');
  });

  test('a rejection in time rejects', async () => {
    const failing = Promise.reject(new Error('failed'));

    await expect(withTimeout(failing, 1000, 'fallback')).rejects.toThrow('failed');
  });

  test('no timer is left once the promise settled', async () => {
    vi.useFakeTimers();
    await withTimeout(Promise.resolve('value'), 1000, 'fallback');

    expect(vi.getTimerCount()).toBe(0);
  });
});
