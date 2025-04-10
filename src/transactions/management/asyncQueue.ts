/**
 * The AsyncQueue class is an async-aware data structure that provides a queue-like
 * behavior for managing asynchronous tasks or operations.
 * It allows to enqueue items and dequeue them asynchronously.
 * This is not thread-safe, but it is async concurrency safe, and
 * it does not guarantee ordering for those that call into and await on enqueue.
 * @group Implementation
 * @category Transactions
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
   * @group Implementation
   * @category Transactions
   */
  enqueue(item: T): void {
    this.enqueueMany([item]);
  }

  /**
   * Enqueues multiple items to the queue.
   *
   * @param items - The items to be added to the queue.
   * @group Implementation
   * @category Transactions
   */
  enqueueMany(items: T[]): void {
    this.cancelled = false;

    // Process as many items as we have pending dequeues.
    const numItemsToResolveImmediately = Math.min(this.pendingDequeue.length, items.length);

    for (let i = 0; i < numItemsToResolveImmediately; i++) {
      const promise = this.pendingDequeue.shift();
      promise?.resolve(items[i]);
    }

    // Add remaining items to the queue.
    if (numItemsToResolveImmediately < items.length) {
      this.queue.push(...items.slice(numItemsToResolveImmediately));
    }
  }

  /**
   * Dequeues the next item from the queue and returns a promise that resolves to it.
   * If the queue is empty, it creates a new promise that will be resolved when an item is enqueued.
   *
   * @returns Promise<T>
   * @group Implementation
   * @category Transactions
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
   * Dequeues all items from the queue and returns a promise that resolves to an array
   * of items. If the queue is empty, it creates a new promise that will be resolved to
   * an array with a single item when an item is enqueued.
   *
   * @returns Promise<T[]> - A promise that resolves to an array of all items in the queue.
   * @group Implementation
   * @category Transactions
   */
  async dequeueAll(): Promise<T[]> {
    if (this.queue.length > 0) {
      // Get all items from the queue.
      const items = [...this.queue];
      // Clear the queue.
      this.queue.length = 0;
      return Promise.resolve(items);
    }

    return new Promise<T[]>((resolve, reject) => {
      // When an item is added, it will resolve with that single item as an array.
      this.pendingDequeue.push({
        resolve: (item: T) => resolve([item]),
        reject,
      });
    });
  }

  /**
   * Determine whether the queue is empty.
   *
   * @returns boolean - Returns true if the queue has no elements, otherwise false.
   * @group Implementation
   * @category Transactions
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Cancels all pending promises in the queue and rejects them with an AsyncQueueCancelledError.
   * This ensures that any awaiting code can handle the cancellation appropriately.
   *
   * @returns {void}
   * @group Implementation
   * @category Transactions
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
   * @group Implementation
   * @category Transactions
   */
  isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Retrieve the length of the pending dequeue.
   *
   * @returns number - The number of items currently in the pending dequeue.
   * @group Implementation
   * @category Transactions
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
 * @group Implementation
 * @category Transactions
 */
export class AsyncQueueCancelledError extends Error {}
