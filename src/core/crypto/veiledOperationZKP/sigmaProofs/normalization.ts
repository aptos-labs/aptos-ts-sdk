// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../../twistedEd25519";
import { TwistedElGamalCiphertext, TwistedElGamal } from "../../twistedElGamal";
import { HexInput } from "../../../../types";
import { amountToChunks, genFiatShamirChallenge, publicKeyToU8, toTwistedEd25519PrivateKey } from "../helpers";
import { ed25519GenRandom, ed25519modN, ed25519InvertN, ed25519GenListOfRandom } from "../../utils";
import { VEILED_BALANCE_CHUNK_SIZE } from "../consts";
import { deserializeSigmaProofVeiledNormalization, serializeSigmaProofVeiledNormalization } from "../sigmaProofsSerializers";

export interface SigmaProofVeiledNormalizationInputs {
  privateKey: TwistedEd25519PrivateKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  balance: bigint;
  randomness?: bigint[];
}

export interface SigmaProofVeiledNormalizationOutputs {
  proof: Uint8Array;
  normalizedEncryptedBalance: TwistedElGamalCiphertext[];
}


export interface VerifySigmaProofVeiledNormalizationInputs {
  publicKey: TwistedEd25519PublicKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  normalizedEncryptedBalance: TwistedElGamalCiphertext[];
  proof: Uint8Array;
}

/*
 * The domain separation tag (DST) used in the Fiat-Shamir transform of our Sigma-protocol.
 */
const FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/NormalizationSubproofFiatShamir";

/**
 * Generates Sigma Zero Knowledge Proof for normalization from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.balance Decrypted balance
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export function genSigmaProofVeiledNormalization(opts: SigmaProofVeiledNormalizationInputs): SigmaProofVeiledNormalizationOutputs {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const privateKey = toTwistedEd25519PrivateKey(opts.privateKey);
  const randList = opts.randomness ?? ed25519GenListOfRandom()

  const x1 = ed25519GenRandom();
  const x2 = ed25519GenRandom();
  const x3 = ed25519GenRandom();

  const x4List = ed25519GenListOfRandom()
  const x5List = ed25519GenListOfRandom()

  const X1 = RistrettoPoint.BASE.multiply(x1)
    .add(
      opts.encryptedBalance.reduce((acc, ciphertext, i) => 
        acc.add(ciphertext.D.multiply(2n ** (BigInt(i) * 32n)))
      , RistrettoPoint.ZERO)
      .multiply(x2)
    );
  const X2 = H_RISTRETTO.multiply(x3);
  const X3List = x4List.map((item, index) => RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])).toRawBytes())
  const X4List = x5List.map((item) => RistrettoPoint.fromHex(privateKey.publicKey().toUint8Array()).multiply(item).toRawBytes())

  const normalizedBalance = amountToChunks(opts.balance, VEILED_BALANCE_CHUNK_SIZE);
  const normalizedEncryptedBalance = normalizedBalance.map(
    (chunk, i) => TwistedElGamal.encryptWithPK(chunk, privateKey.publicKey(), randList[i])
  )

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    privateKey.publicKey().toUint8Array(),
    ...opts.encryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...normalizedEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    X1.toRawBytes(),
    X2.toRawBytes(),
    ...X3List,
    ...X4List
  );

  const sLE = bytesToNumberLE(privateKey.toUint8Array());
  const invertSLE = ed25519InvertN(sLE);

  const pt = ed25519modN(p * opts.balance);
  const ps = ed25519modN(p * sLE);
  const psInvert = ed25519modN(p * invertSLE);

  const alpha1 = ed25519modN(x1 - pt);
  const alpha2 = ed25519modN(x2 - ps);
  const alpha3 = ed25519modN(x3 - psInvert);
  const alpha4List = x4List.map((x4, i) => numberToBytesLE(ed25519modN(x4 - p * normalizedBalance[i]), 32));
  const alpha5List = x5List.map((x5, i) => 
     numberToBytesLE(ed25519modN(x5 - p * randList[i]), 32)
  );

  return {
    normalizedEncryptedBalance,
    proof: serializeSigmaProofVeiledNormalization({
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List,
      alpha5List,
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List,
      X4List,
    })
  }
}

/**
 * Verify Sigma Zero Knowledge Proof for normalization from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.encryptedBalance Non-normalized balance encrypted by public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.normalizedEncryptedBalance Normalized balance encrypted by public key (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.proof Sigma Zero Knowledge Proof for veiled normalization
 */
export function verifySigmaProofVeiledNormalization(opts: VerifySigmaProofVeiledNormalizationInputs): boolean {
  const proof = deserializeSigmaProofVeiledNormalization(opts.proof);
  const publicKeyU8 = publicKeyToU8(opts.publicKey);

  const alpha1LE = bytesToNumberLE(proof.alpha1);
  const alpha2LE = bytesToNumberLE(proof.alpha2);
  const alpha3LE = bytesToNumberLE(proof.alpha3);
  const alpha4LEList = proof.alpha4List.map(a => bytesToNumberLE(a))
  const alpha5LEList = proof.alpha5List.map(a => bytesToNumberLE(a))

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    publicKeyU8,
    ...opts.encryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...opts.normalizedEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    proof.X1,
    proof.X2,
    ...proof.X3List,
    ...proof.X4List,
  );
  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
  const alpha2D = opts.encryptedBalance
    .reduce((acc, { D }, i) => acc.add(D.multiply(2n ** (BigInt(i) * 32n))), RistrettoPoint.ZERO)
    .multiply(alpha2LE)
  const pBlaOld = opts.encryptedBalance
    .reduce((acc, ciphertext, i) => {
      const chunk = ciphertext.C.multiply(2n ** (BigInt(i) * 32n))
      return acc.add(chunk)
    }, RistrettoPoint.ZERO)
    .multiply(p)

  const alpha3H = H_RISTRETTO.multiply(alpha3LE);
  const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);
  const X1 = alpha1G.add(alpha2D).add(pBlaOld)
  const X2 = alpha3H.add(pP);
  const X3List = alpha4LEList.map((a, i) => {
    const aG = RistrettoPoint.BASE.multiply(a)
    const aH = H_RISTRETTO.multiply(alpha5LEList[i])
    const pC = opts.normalizedEncryptedBalance[i].C.multiply(p)
    return aG.add(aH).add(pC)
  });
  const X4List = alpha5LEList.map(
    (a, i) => RistrettoPoint.fromHex(publicKeyU8)
      .multiply(a)
      .add(opts.normalizedEncryptedBalance[i].D.multiply(p))
    );

  return X1.equals(RistrettoPoint.fromHex(proof.X1)) &&
    X2.equals(RistrettoPoint.fromHex(proof.X2)) &&
    X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(proof.X3List[i]))) &&
    X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(proof.X4List[i])))
}

