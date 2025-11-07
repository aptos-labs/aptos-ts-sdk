import { Serializable } from "@aptos-labs/ts-bcs";

/**
 * An abstract representation of a cryptographic proof associated with specific
 * zero-knowledge proof schemes, such as Groth16 and PLONK.
 * @group Implementation
 * @category Serialization
 */
export abstract class Proof extends Serializable {}
