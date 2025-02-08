import { Serializer, Serializable } from "../../bcs/serializer";
import { TokenBucket } from "./tokenBucket";
import { Deserializer } from "../../bcs/deserializer";
import { EntryFunctionArgument } from "../../transactions/instances/transactionArgument";

export class RateLimiter extends Serializable implements EntryFunctionArgument {
  readonly tokenBucket: TokenBucket;

  constructor({ tokenBucket }: { tokenBucket: TokenBucket }) {
    super();
    this.tokenBucket = tokenBucket;
  }

  serialize(serializer: Serializer): void {
    serializer.serializeU32AsUleb128(0);
    this.tokenBucket.serialize(serializer);
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

  serializeForEntryFunction(serializer: Serializer): void {
    this.serialize(serializer);
  }
}
