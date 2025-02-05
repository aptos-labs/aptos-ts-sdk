import { Deserializer } from "../../bcs/deserializer";
import { Serializable, Serializer } from "../../bcs/serializer";

export class TokenBucket extends Serializable {
  // Maximum number of tokens allowed at any time.
  readonly capacity: bigint;

  // Current number of tokens remaining in this interval.
  readonly currentAmount: bigint;

  // refill `capacity` number of tokens every `refill_interval` in seconds.
  readonly refillInterval: bigint;

  // Last time the bucket was refilled (in seconds)
  readonly lastRefillTimestamp: bigint;

  // accumulated amount that hasn't yet added up to a full token
  readonly fractionalAccumulated: bigint;

  constructor({
    capacity,
    currentAmount,
    refillInterval,
    lastRefillTimestamp,
    fractionalAccumulated,
  }: {
    capacity: bigint;
    currentAmount: bigint;
    refillInterval: bigint;
    lastRefillTimestamp: bigint;
    fractionalAccumulated: bigint;
  }) {
    super();
    this.capacity = capacity;
    this.currentAmount = currentAmount;
    this.refillInterval = refillInterval;
    this.lastRefillTimestamp = lastRefillTimestamp;
    this.fractionalAccumulated = fractionalAccumulated;
  }

  static from(args: {
    capacity: bigint;
    currentAmount: bigint;
    refillInterval: bigint;
    lastRefillTimestamp: bigint;
    fractionalAccumulated: bigint;
  }): TokenBucket {
    return new TokenBucket(args);
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU64(this.capacity);
    serializer.serializeU64(this.currentAmount);
    serializer.serializeU64(this.refillInterval);
    serializer.serializeU64(this.lastRefillTimestamp);
    serializer.serializeU64(this.fractionalAccumulated);
  }

  static deserialize(deserializer: Deserializer): TokenBucket {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== 0) {
      throw new Error("Invalid token bucket variant");
    }
    return new TokenBucket({
      capacity: deserializer.deserializeU64(),
      currentAmount: deserializer.deserializeU64(),
      refillInterval: deserializer.deserializeU64(),
      lastRefillTimestamp: deserializer.deserializeU64(),
      fractionalAccumulated: deserializer.deserializeU64(),
    });
  }
}
