import { AsyncQueue, AsyncQueueCancelledError } from "../../../src/transactions/management/asyncQueue";

describe("asyncQueue", () => {
  it("should enqueue and dequeue items", async () => {
    const asyncQueue = new AsyncQueue<number>();

    asyncQueue.enqueue(1);

    const item1 = await asyncQueue.dequeue();

    asyncQueue.enqueue(2);
    asyncQueue.enqueue(3);

    const item2 = await asyncQueue.dequeue();
    const item3 = await asyncQueue.dequeue();

    expect(item1).toBe(1);
    expect(item2).toBe(2);
    expect(item3).toBe(3);
  });

  it("should enqueue multiple items at once with enqueueMany", async () => {
    const asyncQueue = new AsyncQueue<number>();

    asyncQueue.enqueueMany([1, 2, 3]);

    const item1 = await asyncQueue.dequeue();
    const item2 = await asyncQueue.dequeue();
    const item3 = await asyncQueue.dequeue();

    expect(item1).toBe(1);
    expect(item2).toBe(2);
    expect(item3).toBe(3);
  });

  it("should handle enqueueMany with pending dequeues", async () => {
    const asyncQueue = new AsyncQueue<number>();

    const itemPromise1 = asyncQueue.dequeue();
    const itemPromise2 = asyncQueue.dequeue();
    const itemPromise3 = asyncQueue.dequeue();

    expect(asyncQueue.pendingDequeueLength()).toBe(3);

    asyncQueue.enqueueMany([10, 20, 30, 40]);

    const item1 = await itemPromise1;
    const item2 = await itemPromise2;
    const item3 = await itemPromise3;
    const item4 = await asyncQueue.dequeue();

    expect(item1).toBe(10);
    expect(item2).toBe(20);
    expect(item3).toBe(30);
    expect(item4).toBe(40);
    expect(asyncQueue.isEmpty()).toBe(true);
  });

  it("should dequeue all items with dequeueAll when queue has items", async () => {
    const asyncQueue = new AsyncQueue<number>();

    asyncQueue.enqueueMany([1, 2, 3]);

    const items = await asyncQueue.dequeueAll();

    expect(items).toEqual([1, 2, 3]);
    expect(asyncQueue.isEmpty()).toBe(true);
  });

  it("should handle dequeueAll before enqueue", async () => {
    const asyncQueue = new AsyncQueue<number>();

    const itemsPromise = asyncQueue.dequeueAll();
    expect(asyncQueue.pendingDequeueLength()).toBe(1);

    asyncQueue.enqueue(42);

    const items = await itemsPromise;
    expect(items).toEqual([42]);
    expect(asyncQueue.isEmpty()).toBe(true);
  });

  it("should handle cancellation with dequeueAll", async () => {
    const asyncQueue = new AsyncQueue<number>();

    const itemsPromise = asyncQueue.dequeueAll();
    expect(asyncQueue.pendingDequeueLength()).toBe(1);

    asyncQueue.cancel();

    await expect(itemsPromise).rejects.toThrow(AsyncQueueCancelledError);
    expect(asyncQueue.pendingDequeueLength()).toBe(0);
  });

  it("should handle dequeue before queue", async () => {
    const asyncQueue = new AsyncQueue<number>();

    const itemPromise1 = asyncQueue.dequeue();
    const itemPromise2 = asyncQueue.dequeue();

    expect(asyncQueue.pendingDequeueLength()).toBe(2);

    asyncQueue.enqueue(1);
    asyncQueue.enqueue(2);

    const item1 = await itemPromise1;
    const item2 = await itemPromise2;

    expect(item1).toBe(1);
    expect(item2).toBe(2);

    expect(asyncQueue.pendingDequeueLength()).toBe(0);
  });

  it("should handle cancellation", async () => {
    const asyncQueue = new AsyncQueue<number>();

    const itemPromise1 = asyncQueue.dequeue();
    const itemPromise2 = asyncQueue.dequeue();

    expect(asyncQueue.pendingDequeueLength()).toBe(2);

    asyncQueue.cancel();

    await expect(itemPromise1).rejects.toThrow(AsyncQueueCancelledError);
    await expect(itemPromise2).rejects.toThrow(AsyncQueueCancelledError);

    expect(asyncQueue.isCancelled()).toBe(true);

    expect(asyncQueue.pendingDequeueLength()).toBe(0);
  });

  it("should handle cancellation without errors if queue is empty", () => {
    const asyncQueue = new AsyncQueue<number>();

    asyncQueue.cancel();

    expect(asyncQueue.isCancelled()).toBe(true);
  });

  it("should check if the queue is empty", () => {
    const asyncQueue = new AsyncQueue<number>();
    expect(asyncQueue.isEmpty()).toBe(true);

    asyncQueue.enqueue(1);

    expect(asyncQueue.isEmpty()).toBe(false);
  });

  it("should remove cancelled status after a new enqueue", () => {
    const asyncQueue = new AsyncQueue<number>();

    asyncQueue.cancel();

    expect(asyncQueue.isCancelled()).toBe(true);

    asyncQueue.enqueue(1);

    expect(asyncQueue.isCancelled()).toBe(false);
  });
});
