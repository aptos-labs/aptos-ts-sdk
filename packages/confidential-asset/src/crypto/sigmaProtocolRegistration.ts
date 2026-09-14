// Copyright (c) Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Sigma protocol proof for confidential asset registration.
 *
 * The NP relation (from `sigma_protocol_registration.move`):
 *
 *   H = dk * ek
 *
 * where:
 *   - H is the encryption key basepoint (= hash_to_point_base)
 *   - ek is the encryption key being registered
 *   - dk is the secret decryption key
 *
 * The homomorphism psi(dk) outputs: [dk * ek]
 * The transformation function f outputs: [H]
 */

import { bytesToNumberLE } from "@noble/curves/utils.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { H_RISTRETTO, TwistedEd25519PrivateKey } from "./twistedEd25519.js";
import type { RistrettoPoint } from "./ristrettoPoint.js";
import {
  sigmaProtocolProve,
  sigmaProtocolVerify,
  APTOS_FRAMEWORK_ADDRESS,
  type DomainSeparator,
  type SigmaProtocolStatement,
  type SigmaProtocolProof,
  type PsiFunction,
  type TransformationFunction,
} from "./sigmaProtocol.js";
import { Serializer, FixedBytes } from "@aptos-labs/ts-sdk";

/** Protocol ID matching the Move constant */
const PROTOCOL_ID = "AptosConfidentialAsset/RegistrationV1";

/** Fully qualified Move type name for the phantom marker type, matching `type_info::type_name<Registration>()` */
const TYPE_NAME = "0x1::sigma_protocol_registration::Registration";

/** Statement point indices */
const IDX_H = 0;
const IDX_EK = 1;

/**
 * BCS-serialize a RegistrationSession matching the Move struct:
 * ```move
 * struct RegistrationSession { sender: address, asset_type: Object<Metadata> }
 * ```
 */
export function bcsSerializeRegistrationSession(senderAddress: Uint8Array, tokenTypeAddress: Uint8Array): Uint8Array {
  const serializer = new Serializer();
  serializer.serialize(new FixedBytes(senderAddress));
  serializer.serialize(new FixedBytes(tokenTypeAddress));
  return serializer.toUint8Array();
}

/**
 * Build the homomorphism psi for registration.
 *
 * psi(dk) = [dk * ek]
 */
function makeRegistrationPsi(): PsiFunction {
  return (s: SigmaProtocolStatement, w: bigint[]): RistrettoPoint[] => {
    const dk = w[0];
    const ek = s.points[IDX_EK];
    return [ek.multiply(dk)];
  };
}

/**
 * Build the transformation function f for registration.
 *
 * f(stmt) = [H]
 */
function makeRegistrationF(): TransformationFunction {
  return (s: SigmaProtocolStatement): RistrettoPoint[] => {
    return [s.points[IDX_H]];
  };
}

/**
 * Prove knowledge of dk such that ek = dk^{-1} * H.
 */
export function proveRegistration(args: {
  dk: TwistedEd25519PrivateKey;
  senderAddress: Uint8Array;
  tokenAddress: Uint8Array;
  chainId: number;
}): SigmaProtocolProof {
  const { dk, senderAddress, tokenAddress, chainId } = args;
  const dkBigint = bytesToNumberLE(dk.toUint8Array());

  const ekBytes = dk.publicKey().toUint8Array();
  const ek = ristretto255.Point.fromBytes(ekBytes);
  const H = H_RISTRETTO;

  const stmt: SigmaProtocolStatement = {
    points: [H, ek],
    compressedPoints: [H.toBytes(), ekBytes],
    scalars: [],
  };

  const witness = [dkBigint];

  const sessionId = bcsSerializeRegistrationSession(senderAddress, tokenAddress);
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolProve(dst, TYPE_NAME, makeRegistrationPsi(), stmt, witness);
}

/**
 * Verify a registration sigma protocol proof.
 */
export function verifyRegistration(args: {
  ek: Uint8Array;
  senderAddress: Uint8Array;
  tokenAddress: Uint8Array;
  chainId: number;
  proof: SigmaProtocolProof;
}): boolean {
  const { ek: ekBytes, senderAddress, tokenAddress, chainId, proof } = args;
  const ek = ristretto255.Point.fromBytes(ekBytes);
  const H = H_RISTRETTO;

  const stmt: SigmaProtocolStatement = {
    points: [H, ek],
    compressedPoints: [H.toBytes(), ekBytes],
    scalars: [],
  };

  const sessionId = bcsSerializeRegistrationSession(senderAddress, tokenAddress);
  const dst: DomainSeparator = {
    contractAddress: APTOS_FRAMEWORK_ADDRESS,
    chainId,
    protocolId: utf8ToBytes(PROTOCOL_ID),
    sessionId,
  };

  return sigmaProtocolVerify(dst, TYPE_NAME, makeRegistrationPsi(), makeRegistrationF(), stmt, proof);
}
