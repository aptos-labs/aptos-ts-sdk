import { KeylessAccount } from "../account";
import { AptosApiError } from "../client/types";

export type ProverResponse = {
  proof: { a: string; b: string; c: string };
  public_inputs_hash: string;
  training_wheels_signature: string;
};
export type PepperFetchResponse = { signature: string; pepper: string; address: string };

export enum KeylessErrorType {
  JWK_EXPIRED,
  EPK_EXPIRED,
  UNKNOWN_INVALID_SIGNATURE,
  UNKNOWN,
}
export class KeylessError extends Error {
  readonly type: KeylessErrorType;

  private constructor(type: KeylessErrorType) {
    super();
    this.type = type;
  }

  static async fromAptosApiError(error: AptosApiError, signer: KeylessAccount): Promise<KeylessError> {
    if (!error.data.message.includes("INVALID_SIGNATURE")) {
      return new KeylessError(KeylessErrorType.UNKNOWN);
    }
    if (signer.isExpired()) {
      return new KeylessError(KeylessErrorType.EPK_EXPIRED);
    }
    if (!(await signer.checkJwkValidity())) {
      return new KeylessError(KeylessErrorType.JWK_EXPIRED);
    }
    return new KeylessError(KeylessErrorType.UNKNOWN_INVALID_SIGNATURE);
  }
}
