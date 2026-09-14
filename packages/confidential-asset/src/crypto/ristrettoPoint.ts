import { ristretto255 } from "@noble/curves/ed25519.js";

// TODO: do we need InstanceType?
export type RistrettoPoint = InstanceType<typeof ristretto255.Point>;
