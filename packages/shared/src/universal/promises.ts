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
