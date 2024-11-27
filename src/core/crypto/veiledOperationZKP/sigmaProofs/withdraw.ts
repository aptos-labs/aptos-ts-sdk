// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import { utf8ToBytes } from "@noble/hashes/utils";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../../twistedEd25519";
import { TwistedElGamal, TwistedElGamalCiphertext } from "../../twistedElGamal";
import { HexInput } from "../../../../types";
import { amountToChunks, genFiatShamirChallenge, publicKeyToU8, toTwistedEd25519PrivateKey } from "../helpers";
import { ed25519GenRandom, ed25519modN, ed25519InvertN, ed25519GenListOfRandom } from "../../utils";
import { CHUNK_BITS_BI, VEILED_BALANCE_CHUNK_SIZE } from "../consts";
import { deserializeSigmaProofVeiledWithdraw, serializeVeiledWithdrawSigmaProof } from "../sigmaProofsSerializers";

export interface SigmaProofVeiledWithdrawInputs {
  privateKey: TwistedEd25519PrivateKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  amount: bigint;
  changedBalance: bigint;
  randomness?: bigint[];
}

export interface SigmaProofVeiledWithdrawOutputs {
  proof: Uint8Array;
  newEncryptedBalance: TwistedElGamalCiphertext[];
}

export interface VerifySigmaProofVeiledWithdrawInputs {
  publicKey: TwistedEd25519PublicKey | HexInput;
  oldEncryptedBalance: TwistedElGamalCiphertext[];
  newEncryptedBalance: TwistedElGamalCiphertext[];
  amount: bigint;
  proof: Uint8Array;
}


/*
 * The domain separation tag (DST) used in the Fiat-Shamir transform of our Sigma-protocol.
 */
const FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalSubproofFiatShamir";

/**
 * Generates Sigma Zero Knowledge Proof for withdraw from the veiled balance
 *
 * @param opts.privateKey Twisted ElGamal Ed25519 private key.
 * @param opts.encryptedBalance Ciphertext points encrypted by Twisted ElGamal
 * @param opts.amount Amount of withdraw
 * @param opts.changedBalance Balance after withdraw
 * @param opts.randomness List of random numbers less than ed25519.CURVE.n (bigint) for chunked balance
 */
export function genSigmaProofVeiledWithdraw(opts: SigmaProofVeiledWithdrawInputs): SigmaProofVeiledWithdrawOutputs {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  const randList = opts.randomness ?? ed25519GenListOfRandom()
  const chunkedAmount = amountToChunks(opts.amount, 2);
  const chunkedNewBalance = amountToChunks(opts.changedBalance, VEILED_BALANCE_CHUNK_SIZE);

  const privateKey = toTwistedEd25519PrivateKey(opts.privateKey);

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

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    ...chunkedAmount.map(a => numberToBytesLE(a, 32)),
    privateKey.publicKey().toUint8Array(),
    ...opts.encryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    X1.toRawBytes(),
    X2.toRawBytes(),
    ...X3List,
    ...X4List,
  );

  const sLE = bytesToNumberLE(privateKey.toUint8Array());
  const invertSLE = ed25519InvertN(sLE);

  const pt = ed25519modN(p * opts.changedBalance);
  const ps = ed25519modN(p * sLE);
  const psInvert = ed25519modN(p * invertSLE);

  const alpha1 = ed25519modN(x1 - pt);
  const alpha2 = ed25519modN(x2 - ps);
  const alpha3 = ed25519modN(x3 - psInvert);
  const alpha4List = x4List.map((x4, i) => {
    const pChunk = ed25519modN(p * chunkedNewBalance[i])
    return numberToBytesLE(ed25519modN(x4 - pChunk), 32);
  });
  const alpha5List = x5List.map((x5, i) => {
    const pRand = ed25519modN(p * randList[i])
    return numberToBytesLE(ed25519modN(x5 - pRand), 32);
  });

  return {
    newEncryptedBalance: chunkedNewBalance.map(
      (chunk, i) => TwistedElGamal.encryptWithPK(chunk, privateKey.publicKey(), randList[i])
    ),
    proof: serializeVeiledWithdrawSigmaProof({
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
 * Verify Sigma Zero Knowledge Proof of withdraw from the veiled balance
 *
 * @param opts.publicKey Twisted ElGamal Ed25519 public key.
 * @param opts.oldEncryptedBalance Original encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Encrypted balance after withdraw (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of withdraw
 * @param opts.proof Sigma Zero Knowledge Proof for veiled withdraw
 */
export function verifySigmaProofVeiledWithdraw(opts: VerifySigmaProofVeiledWithdrawInputs): boolean {
  const proof = deserializeSigmaProofVeiledWithdraw(opts.proof);
  const publicKeyU8 = publicKeyToU8(opts.publicKey);
  const chunkedAmount = amountToChunks(opts.amount, 2);

  const alpha1LE = bytesToNumberLE(proof.alpha1);
  const alpha2LE = bytesToNumberLE(proof.alpha2);
  const alpha3LE = bytesToNumberLE(proof.alpha3);
  const alpha4LEList = proof.alpha4List.map(a => bytesToNumberLE(a))
  const alpha5LEList = proof.alpha5List.map(a => bytesToNumberLE(a))

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    ...chunkedAmount.map(a => numberToBytesLE(a, 32)),
    publicKeyU8,
    ...opts.oldEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    proof.X1,
    proof.X2,
    ...proof.X3List,
    ...proof.X4List,
  );

  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);
  const { DOldSum, COldSum } = opts.oldEncryptedBalance.reduce( (acc, { C, D }, i) => {
    const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI)
    return {
      DOldSum: acc.DOldSum.add(D.multiply(coef)),
      COldSum: acc.COldSum.add(C.multiply(coef)),
    }
  }, {DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO })
  const alpha2DOld = DOldSum.multiply(alpha2LE)
  const amountG = RistrettoPoint.BASE.multiply(opts.amount)  

  const alpha3H = H_RISTRETTO.multiply(alpha3LE);
  const pP = RistrettoPoint.fromHex(publicKeyU8).multiply(p);

  const X1 = alpha1G
    .add(alpha2DOld)
    .add(COldSum.subtract(amountG).multiply(p));
  const X2 = alpha3H.add(pP);

  const X3List = alpha4LEList.map((a, i) => {
    const aG = RistrettoPoint.BASE.multiply(a)
    const aH = H_RISTRETTO.multiply(alpha5LEList[i])
    const pC = opts.newEncryptedBalance[i].C.multiply(p)
    return aG.add(aH).add(pC)
  });
  const X4List = alpha5LEList.map(
    (a, i) => RistrettoPoint.fromHex(publicKeyU8)
      .multiply(a)
      .add(opts.newEncryptedBalance[i].D.multiply(p))
    );

  return X1.equals(RistrettoPoint.fromHex(proof.X1)) &&
    X2.equals(RistrettoPoint.fromHex(proof.X2)) &&
    X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(proof.X3List[i]))) &&
    X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(proof.X4List[i])))
}