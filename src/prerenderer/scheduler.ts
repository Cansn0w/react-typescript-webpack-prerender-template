export interface Scheduler<T> {
  /**
   * Schedule a task to be executed later.
   * @returns {Promise<T>} resolves when the task resolves.
   */
  run(task: () => Promise<T>): Promise<T>;
}

export class NoopScheduler<T> implements Scheduler<T> {
  run(task: () => Promise<T>) {
    return task();
  }
}

/**
 * Allow at most {@param limit} number of concurrent tasks.
 */
export class SemaphoreScheduler<T> implements Scheduler<T> {
  private q: (() => Promise<void>)[] = [];
  private count = 0;

  constructor(private limit: number) {}

  run(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((res) => {
      const next = () => {
        const queued = this.q.shift();
        if (queued != null) {
          queued();
        } else {
          this.count -= 1;
        }
      };
      const managed = () =>
        task().then((value) => {
          res(value);
          next();
        });
      if (this.count < this.limit) {
        this.count += 1;
        managed();
      } else {
        this.q.push(managed);
      }
    });
  }
}
