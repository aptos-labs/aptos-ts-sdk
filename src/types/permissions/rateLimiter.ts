import { Serializer, Serializable } from "../../bcs/serializer";
import { Deserializer } from "../../bcs/deserializer";

/**
 * Represents a rate limiter that enforces a token bucket-based rate limit.
 * This class implements the RateLimiter enum from the Move language.
 *
 * @property {TokenBucket} tokenBucket - The token bucket configuration for rate limiting.
 */
export class RateLimiter extends Serializable {
  readonly tokenBucket: TokenBucket;

  constructor({ tokenBucket }: { tokenBucket: TokenBucket }) {
    super();
    this.tokenBucket = tokenBucket;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(0);
    this.tokenBucket.serialize(serializer);
  }

  /**
   * A default rate limiter that refills 1000 tokens every 60 seconds.
   */
  static fromDefaultTokenBucket({
    capacity = 1000,
    refillInterval = 60,
  }: {
    capacity?: bigint | number;
    refillInterval?: bigint | number;
  }): RateLimiter {
    return new RateLimiter({
      tokenBucket: TokenBucket.from({
        capacity: BigInt(capacity),
        currentAmount: BigInt(0),
        refillInterval: BigInt(refillInterval),
        lastRefillTimestamp: BigInt(0),
        fractionalAccumulated: BigInt(0),
      }),
    });
  }

  static from(args: { tokenBucket: TokenBucket }): RateLimiter {
    return new RateLimiter(args);
  }

  static deserialize(deserializer: Deserializer): RateLimiter {
    const variant = deserializer.deserializeUleb128AsU32();
    if (variant !== 0) {
      throw new Error("Invalid rate limiter variant");
    }
    return new RateLimiter({ tokenBucket: TokenBucket.deserialize(deserializer) });
  }
}

/**
 * Represents a token bucket that enforces a token bucket-based rate limit.
 * This class implements the TokenBucket struct used in the RateLimiter enum.
 *
 * @property {bigint} capacity - The maximum number of tokens allowed at any time.
 * @property {bigint} currentAmount - The current number of tokens remaining in this interval.
 * @property {bigint} refillInterval - The interval at which the bucket refills.
 * @property {bigint} lastRefillTimestamp - The timestamp of the last refill.
 * @property {bigint} fractionalAccumulated - The accumulated amount that hasn't yet added up to a full token.
 */
export class TokenBucket extends Serializable {
  readonly capacity: bigint;

  readonly currentAmount: bigint;

  readonly refillInterval: bigint;

  readonly lastRefillTimestamp: bigint;

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
