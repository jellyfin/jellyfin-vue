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
        /* eslint-disable promise/prefer-await-to-then, promise/catch-or-return */
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.activeCount--;

            const next = this.queue.shift();

            if (next) {
              next();
            }
          });
        /* eslint-enable promise/prefer-await-to-then, promise/catch-or-return */
      };

      if (this.activeCount < this.concurrency) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}
