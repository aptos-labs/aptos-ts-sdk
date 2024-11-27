// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";

import { utf8ToBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../../twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "../../twistedElGamal";
import { HexInput } from "../../../../types";
import { toTwistedEd25519PrivateKey , genFiatShamirChallenge, amountToChunks } from "../helpers";
import { ed25519GenRandom, ed25519modN, ed25519InvertN, ed25519GenListOfRandom } from "../../utils";
import { CHUNK_BITS_BI, VEILED_BALANCE_CHUNK_SIZE } from "../consts";
import { deserializeSigmaProofVeiledKeyRotation, serializeSigmaProofVeiledKeyRotation } from "../sigmaProofsSerializers";


export interface SigmaProofVeiledKeyRotationInputs {
  oldPrivateKey: TwistedEd25519PrivateKey | HexInput;
  newPrivateKey: TwistedEd25519PrivateKey | HexInput;
  balance: bigint;
  oldEncryptedBalance: TwistedElGamalCiphertext[];
  randomness?: bigint[];
}

export interface SigmaProofVeiledKeyRotationOutputs {
  proof: Uint8Array;
  newEncryptedBalance: TwistedElGamalCiphertext[];
}

export interface VerifySigmaProofVeiledKeyRotationInputs {
  oldPublicKey: TwistedEd25519PublicKey;
  newPublicKey: TwistedEd25519PublicKey;
  oldEncryptedBalance: TwistedElGamalCiphertext[];
  newEncryptedBalance: TwistedElGamalCiphertext[];
  proof: Uint8Array;
}

/*
 * The domain separation tag (DST) used in the Fiat-Shamir transform of our Sigma-protocol.
 */
const FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/RotationSubproofFiatShamir";

/**
 * Generate Sigma Zero Knowledge Proof for key rotation
 *
 * @param opts.oldPrivateKey Old private key (Twisted ElGamal Ed25519).
 * @param opts.newPrivateKey New private key (Twisted ElGamal Ed25519).
 * @param opts.balance Decrypted balance
 * @param opts.oldEncryptedBalance Encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export function genSigmaProofVeiledKeyRotation(opts: SigmaProofVeiledKeyRotationInputs): SigmaProofVeiledKeyRotationOutputs {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const randList = opts.randomness ?? ed25519GenListOfRandom()

  const x1 = ed25519GenRandom();
  const x2 = ed25519GenRandom();
  const x3 = ed25519GenRandom();
  const x4 = ed25519GenRandom();

  const x5List = ed25519GenListOfRandom()
  const x6List = ed25519GenListOfRandom()

  const oldPrivateKey = toTwistedEd25519PrivateKey(opts.oldPrivateKey);
  const newPrivateKey = toTwistedEd25519PrivateKey(opts.newPrivateKey);
  const oldPublicKey = oldPrivateKey.publicKey();
  const newPublicKey = newPrivateKey.publicKey();

  const chunkedBalance = amountToChunks(opts.balance, VEILED_BALANCE_CHUNK_SIZE)
  const newCiphertext = chunkedBalance.map((chunk, i) => TwistedElGamal.encryptWithPK(chunk, newPublicKey, randList[i]))

  const X1 = RistrettoPoint.BASE.multiply(x1)
  .add(
    opts.oldEncryptedBalance.reduce((acc, ciphertext, i) => 
      acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n)))
    , RistrettoPoint.ZERO)
    .multiply(x2)
  );
  const X2 = H_RISTRETTO.multiply(x3)
  const X3 = H_RISTRETTO.multiply(x4)
  const X4List = x5List.map((item, index) => RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x6List[index])).toRawBytes())
  const X5List = x6List.map((item) => RistrettoPoint.fromHex(newPublicKey.toUint8Array()).multiply(item).toRawBytes())

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    oldPublicKey.toUint8Array(),
    newPublicKey.toUint8Array(),
    ...opts.oldEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...newCiphertext.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    X1.toRawBytes(),
    X2.toRawBytes(),
    X3.toRawBytes(),
    ...X4List,
    ...X5List,
  );

  const oldSLE = bytesToNumberLE(oldPrivateKey.toUint8Array());
  const invertOldSLE = ed25519InvertN(oldSLE);
  const newSLE = bytesToNumberLE(newPrivateKey.toUint8Array());
  const invertNewSLE = ed25519InvertN(newSLE);

  const alpha1 = ed25519modN(x1 - p * opts.balance);
  const alpha2 = ed25519modN(x2 - p * oldSLE);
  const alpha3 = ed25519modN(x3 - p * invertOldSLE);
  const alpha4 = ed25519modN(x4 - p * invertNewSLE);
  const alpha5List = x5List.map((x5, i) => {
    const pChunk = ed25519modN(p * chunkedBalance[i])
    return numberToBytesLE(ed25519modN(x5 - pChunk), 32);
  });
  const alpha6List = x6List.map((x6, i) => {
    const pRand = ed25519modN(p * randList[i])
    return numberToBytesLE(ed25519modN(x6 - pRand), 32);
  });


  return {
    newEncryptedBalance: newCiphertext,
    proof: serializeSigmaProofVeiledKeyRotation({
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4: numberToBytesLE(alpha4, 32),
      alpha5List,
      alpha6List,
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3: X3.toRawBytes(),
      X4List,
      X5List,
    })
  }
}

/**
 * Verify Sigma Zero Knowledge Proof of key rotation
 *
 * @param opts.oldPrivateKey Old public key (Twisted ElGamal Ed25519).
 * @param opts.newPrivateKey New public key (Twisted ElGamal Ed25519).
 * @param opts.oldEncryptedBalance Balance encrypted with previous public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Balance encrypted with new public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.proof Sigma Zero Knowledge Proof for veiled balance key rotation
 */
export function verifySigmaProofVeiledKeyRotation(opts: VerifySigmaProofVeiledKeyRotationInputs): boolean {
  const proof = deserializeSigmaProofVeiledKeyRotation(opts.proof);

  const alpha1LE = bytesToNumberLE(proof.alpha1);
  const alpha2LE = bytesToNumberLE(proof.alpha2);
  const alpha3LE = bytesToNumberLE(proof.alpha3);
  const alpha4LE = bytesToNumberLE(proof.alpha4);
  const alpha5LEList = proof.alpha5List.map(a => bytesToNumberLE(a))
  const alpha6LEList = proof.alpha6List.map(a => bytesToNumberLE(a))

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    opts.oldPublicKey.toUint8Array(),
    opts.newPublicKey.toUint8Array(),
    ...opts.oldEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...opts.newEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    proof.X1,
    proof.X2,
    proof.X3,
    ...proof.X4List,
    ...proof.X5List,
  );

  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
  const { DOldSum, COldSum } = opts.oldEncryptedBalance.reduce( (acc, { C, D }, i) => {
    const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI)
    return {
      DOldSum: acc.DOldSum.add(D.multiply(coef)),
      COldSum: acc.COldSum.add(C.multiply(coef)),
    }
  }, {DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO })

  const X1 = alpha1G
    .add(DOldSum.multiply(alpha2LE))
    .add(COldSum.multiply(p));

  const alpha3H = H_RISTRETTO.multiply(alpha3LE);
  const alpha4H = H_RISTRETTO.multiply(alpha4LE);
  const pkOldRist = RistrettoPoint.fromHex(opts.oldPublicKey.toUint8Array());
  const pkNewRist = RistrettoPoint.fromHex(opts.newPublicKey.toUint8Array());

  const X2 = alpha3H.add(pkOldRist.multiply(p));
  const X3 = alpha4H.add(pkNewRist.multiply(p));
  const X4List = alpha5LEList.map((a, i) => {
    const aG = RistrettoPoint.BASE.multiply(a)
    const aH = H_RISTRETTO.multiply(alpha6LEList[i])
    const pC = opts.newEncryptedBalance[i].C.multiply(p)
    return aG.add(aH).add(pC)
  });
  const X5List = alpha6LEList.map((a, i) => {
    const aPK = pkNewRist.multiply(a)
    const pD = opts.newEncryptedBalance[i].D.multiply(p)
    return aPK.add(pD)
  });

  return X1.equals(RistrettoPoint.fromHex(proof.X1)) &&
  X2.equals(RistrettoPoint.fromHex(proof.X2)) &&
  X3.equals(RistrettoPoint.fromHex(proof.X3)) &&
  X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(proof.X4List[i]))) &&
  X5List.every((X5, i) => X5.equals(RistrettoPoint.fromHex(proof.X5List[i])))
}
