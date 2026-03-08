import { Serializable } from "../bcs/serializer.js";

/**
 * Abstract base class for zero-knowledge proofs.
 *
 * Concrete implementations (e.g. {@link Groth16Zkp}) extend this class and
 * provide a `serialize` method that encodes the proof data for BCS
 * transmission.
 */
export abstract class Proof extends Serializable {}
