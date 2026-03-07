import type { HexInput } from "../hex/index.js";
import { Hex } from "../hex/index.js";

export const convertSigningMessage = (message: HexInput): HexInput => {
  if (typeof message === "string") {
    const isValid = Hex.isValid(message);
    if (!isValid.valid) {
      return new TextEncoder().encode(message);
    }
    return message;
  }
  return message;
};
