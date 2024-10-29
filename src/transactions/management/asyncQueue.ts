/**
 * The AsyncQueue class is an async-aware data structure that provides a queue-like
 * behavior for managing asynchronous tasks or operations.
 * It allows to enqueue items and dequeue them asynchronously.
 * This is not thread-safe, but it is async concurrency safe, and
 * it does not guarantee ordering for those that call into and await on enqueue.
 */

interface PendingDequeue<T> {
  resolve: (value: T) => void;
  reject: (reason?: AsyncQueueCancelledError) => void;
}

export class AsyncQueue<T> {
  readonly queue: T[] = [];

  // The pendingDequeue is used to handle the resolution of promises when items are enqueued and dequeued.
  private pendingDequeue: PendingDequeue<T>[] = [];

  private cancelled: boolean = false;

  /**
   * Adds an item to the queue. If there are pending dequeued promises, it resolves the oldest promise with the enqueued item
   * immediately; otherwise, it adds the item to the queue.
   *
   * @param item - The item to be added to the queue.
   */
  enqueue(item: T): void {
    this.cancelled = false;

    if (this.pendingDequeue.length > 0) {
      const promise = this.pendingDequeue.shift();

      promise?.resolve(item);

      return;
    }

    this.queue.push(item);
  }

  /**
   * Dequeues the next item from the queue and returns a promise that resolves to it.
   * If the queue is empty, it creates a new promise that will be resolved when an item is enqueued.
   *
   * @returns Promise<T>
   */
  async dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift()!);
    }

    return new Promise<T>((resolve, reject) => {
      this.pendingDequeue.push({ resolve, reject });
    });
  }

  /**
   * Determine whether the queue is empty.
   *
   * @returns boolean - Returns true if the queue has no elements, otherwise false.
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Cancels all pending promises in the queue and rejects them with an AsyncQueueCancelledError.
   * This ensures that any awaiting code can handle the cancellation appropriately.
   *
   * @returns {void}
   */
  cancel(): void {
    this.cancelled = true;

    this.pendingDequeue.forEach(async ({ reject }) => {
      reject(new AsyncQueueCancelledError("Task cancelled"));
    });

    this.pendingDequeue = [];

    this.queue.length = 0;
  }

  /**
   * Determine whether the queue has been cancelled.
   *
   * @returns boolean - Returns true if the queue is cancelled, otherwise false.
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Retrieve the length of the pending dequeue.
   *
   * @returns number - The number of items currently in the pending dequeue.
   */
  pendingDequeueLength(): number {
    return this.pendingDequeue.length;
  }
}

/**
 * Represents an error that occurs when an asynchronous queue operation is cancelled.
 * This error extends the built-in Error class to provide additional context for cancellation events.
 *
 * @extends Error
 */
export class AsyncQueueCancelledError extends Error {}
