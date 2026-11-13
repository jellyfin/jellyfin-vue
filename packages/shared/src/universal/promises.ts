export class PromiseQueue {
  private concurrency: number;
  private queue: (() => void)[] = [];
  private activeCount = 0;

  public constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  public add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        this.activeCount++;
        void (async () => {
          try {
            const result = await task();

            resolve(result);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          } finally {
            this.activeCount--;

            const next = this.queue.shift();

            if (next) {
              next();
            }
          }
        })();
      };

      if (this.activeCount < this.concurrency) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

/**
 * Settles like a promise when it settles within `ms` milliseconds; otherwise resolves to `fallback` once the time is
 * up. The timer is cleared as soon as either happens.
 *
 * @param promise - The promise to wait for
 * @param ms - The longest wait, in milliseconds
 * @param fallback - The value when the promise takes longer
 */
export async function withTimeout<T, F>(promise: Promise<T>, ms: number, fallback: F): Promise<T | F> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<F>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback);
    }, ms);
  });

  try {
    return await Promise.race([promise, timedOut]);
  } finally {
    clearTimeout(timer);
  }
}
