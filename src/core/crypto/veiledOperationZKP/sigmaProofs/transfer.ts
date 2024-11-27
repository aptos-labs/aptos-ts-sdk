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
import { Hex } from "../../../hex";
import { CHUNK_BITS_BI, VEILED_BALANCE_CHUNK_SIZE } from "../consts";
import { deserializeSigmaProofVeiledTransfer, serializeSigmaProofVeiledTransfer } from "../sigmaProofsSerializers";

export interface SigmaProofVeiledTransferInputs {
  senderPrivateKey: TwistedEd25519PrivateKey | HexInput;
  recipientPublicKey: TwistedEd25519PublicKey | HexInput;
  encryptedBalance: TwistedElGamalCiphertext[];
  amount: bigint;
  changedBalance: bigint;
  auditorPublicKeys?: (TwistedEd25519PublicKey | HexInput)[];
  randomness?: bigint[];
}

export interface SigmaProofVeiledTransferOutputs {
  proof: Uint8Array;
  newEncryptedBalance: TwistedElGamalCiphertext[];
  encryptedAmountByRecipient: TwistedElGamalCiphertext[];
  maskedAuditorsPublicKeys: Uint8Array[][];
}

export interface VerifySigmaProofVeiledTransferInputs {
  senderPublicKey: TwistedEd25519PublicKey | HexInput;
  recipientPublicKey: TwistedEd25519PublicKey | HexInput;
  oldEncryptedBalance: TwistedElGamalCiphertext[];
  newEncryptedBalance: TwistedElGamalCiphertext[];
  encryptedAmountByRecipient: TwistedElGamalCiphertext[];
  proof: Uint8Array;
  auditors?: {
    publicKeys: (TwistedEd25519PublicKey | HexInput)[];
    decryptionKeys: HexInput[][];
  };
}

/*
 * The domain separation tag (DST) used in the Fiat-Shamir transform of our Sigma-protocol.
 */
const FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/TransferSubproofFiatShamir"

/**
 * Generate Sigma Zero Knowledge Proof for transfer between veiled balances
 *
 * @param opts.senderPrivateKey Sender private key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.encryptedBalance Sender's encrypted balance (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.amount Amount of transfer
 * @param opts.changedBalance Sender's balance after transfer
 * @param opts.auditorPublicKeys The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.random Random number less than ed25519.CURVE.n (bigint)
 */
export function genSigmaProofVeiledTransfer(opts: SigmaProofVeiledTransferInputs): SigmaProofVeiledTransferOutputs {
  if (opts.randomness && opts.randomness.length !== VEILED_BALANCE_CHUNK_SIZE) {
    throw new Error("Invalid length list of randomness");
  }
  if (opts.amount > (2n ** (2n * CHUNK_BITS_BI) - 1n)) {
    throw new Error (`Amount must be less than 2n**${CHUNK_BITS_BI * 2n}`)
  }

  const x1 = ed25519GenRandom();
  const x2 = ed25519GenRandom()
  const x3List = ed25519GenListOfRandom()
  const x4List = ed25519GenListOfRandom()
  const x5 = ed25519GenRandom();
  const x6List = ed25519GenListOfRandom()

  const randList = opts.randomness ?? ed25519GenListOfRandom()

  const senderPrivateKey = toTwistedEd25519PrivateKey(opts.senderPrivateKey);
  const recipientPublicKeyU8 = publicKeyToU8(opts.recipientPublicKey);
  const senderPublicKey = senderPrivateKey.publicKey();
  const senderPKRistretto = RistrettoPoint.fromHex(senderPublicKey.toUint8Array());
  const recipientPKRistretto = RistrettoPoint.fromHex(recipientPublicKeyU8);

  const auditorsU8PublicKeys = opts.auditorPublicKeys?.map((pk) => publicKeyToU8(pk)) ?? [];
  const auditorsDList = auditorsU8PublicKeys.map((pk) => {
    const pkRist = RistrettoPoint.fromHex(pk)
    return randList.map(r => pkRist.multiply(r).toRawBytes())
  });

  const chunkedAmount = amountToChunks(opts.amount, VEILED_BALANCE_CHUNK_SIZE)
  const chunkedBalance = amountToChunks(opts.changedBalance, VEILED_BALANCE_CHUNK_SIZE)
  const encryptedAmountByRecipient = chunkedAmount.map(
    (chunk, i) => TwistedElGamal.encryptWithPK(chunk, new TwistedEd25519PublicKey(recipientPublicKeyU8), randList[i])
  )
  const newEncryptedBalance = chunkedBalance.map(
    (chunk, i) => TwistedElGamal.encryptWithPK(chunk, senderPrivateKey.publicKey(), randList[i])
  )


  const DBal = opts.encryptedBalance.reduce((acc, { D }, i) => 
    acc.add(D.multiply(2n ** (BigInt(i) * CHUNK_BITS_BI)))
  , RistrettoPoint.ZERO)
  const DNewBal = newEncryptedBalance.reduce((acc, { D }, i) => 
    acc.add(D.multiply(2n ** (BigInt(i) * CHUNK_BITS_BI)))
  , RistrettoPoint.ZERO)


  const X1 = RistrettoPoint.BASE.multiply(x1)
    .add(DBal.multiply(x2))
    .subtract(DNewBal.multiply(x2))
    .toRawBytes()
  const X2List = x3List.map((x3) => senderPKRistretto.multiply(x3).toRawBytes());
  const X3List = x3List.map((x3) => recipientPKRistretto.multiply(x3).toRawBytes());
  const X4List = x4List.map((x4, i) => 
    RistrettoPoint.BASE.multiply(x4).add(H_RISTRETTO.multiply(x3List[i])).toRawBytes()
  );
  const X5 = H_RISTRETTO.multiply(x5).toRawBytes();
  const X6List = x6List.map((x6, i) => 
    RistrettoPoint.BASE.multiply(x6).add(H_RISTRETTO.multiply(x3List[i])).toRawBytes()
  );
  const X7List = auditorsU8PublicKeys.map((pk) => 
    x3List.map(x3 => RistrettoPoint.fromHex(pk).multiply(x3).toRawBytes())
  );


  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    senderPublicKey.toUint8Array(),
    recipientPublicKeyU8,
    ...opts.encryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...newEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...encryptedAmountByRecipient.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...auditorsDList.flat(),
    X1,
    ...X2List,
    ...X3List,
    ...X4List,
    X5,
    ...X6List,
    ...X7List.flat()
  );

  const sLE = bytesToNumberLE(senderPrivateKey.toUint8Array());
  const invertSLE = ed25519InvertN(sLE);

  const alpha1 = ed25519modN(x1 - p * opts.changedBalance);
  const alpha2 = ed25519modN(x2 - p * sLE);
  const alpha3List = x3List.map((x3, i) => ed25519modN(x3 - p * randList[i]));
  const alpha4List = x4List.map((x4, i) => ed25519modN(x4 - p * chunkedAmount[i]));
  const alpha5 = ed25519modN(x5 - p * invertSLE);
  const alpha6List = x6List.map((x6, i) => ed25519modN(x6 - p * chunkedBalance[i]), 32);

  const proof = serializeSigmaProofVeiledTransfer({
    alpha1: numberToBytesLE(alpha1, 32),
    alpha2: numberToBytesLE(alpha2, 32),
    alpha3List: alpha3List.map(a => numberToBytesLE(a, 32)),
    alpha4List: alpha4List.map(a => numberToBytesLE(a, 32)),
    alpha5: numberToBytesLE(alpha5, 32),
    alpha6List: alpha6List.map(a => numberToBytesLE(a, 32)),
    X1,
    X2List,
    X3List,
    X4List,
    X5,
    X6List,
    X7List: X7List.flat()
  });

  return {
    proof,
    maskedAuditorsPublicKeys: auditorsDList,
    encryptedAmountByRecipient,
    newEncryptedBalance,
  };
}

/**
 * Verify Sigma Zero Knowledge Proof of veiled transfer
 *
 * @param opts.senderPublicKey Sender public key (Twisted ElGamal Ed25519).
 * @param opts.recipientPublicKey Recipient public key (Twisted ElGamal Ed25519).
 * @param opts.oldEncryptedBalance Sender's encrypted balance before transfer (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.newEncryptedBalance Sender's encrypted balance after transfer (Ciphertext points encrypted by Twisted ElGamal)
 * @param opts.encryptedAmountByRecipient Amount of transfer encrypted by recipient using Twisted ElGamal
 * @param opts.proof Sigma Zero Knowledge Proof for veiled transfer
 * @param opts.auditors.publicKeys The list of auditors's public keys (Twisted ElGamal Ed25519).
 * @param opts.auditors.decryptionKeys The list of corresponding auditor's decryption keys
 */
export function verifySigmaProofVeiledTransfer(opts: VerifySigmaProofVeiledTransferInputs): boolean {
  const proof = deserializeSigmaProofVeiledTransfer(opts.proof)
  const auditorPKs = opts.auditors?.publicKeys.map((pk) => publicKeyToU8(pk)) ?? [];
  const auditorDecryptionKeys = opts.auditors?.decryptionKeys.map(
    (arr) => arr.map(key => Hex.fromHexInput(key).toUint8Array()) 
  ) ?? [];
  const proofX7List = proof.X7List ?? []

  const alpha1LE = bytesToNumberLE(proof.alpha1);
  const alpha2LE = bytesToNumberLE(proof.alpha2);
  const alpha3LEList = proof.alpha3List.map(a => bytesToNumberLE(a))
  const alpha4LEList = proof.alpha4List.map(a => bytesToNumberLE(a))
  const alpha5LE = bytesToNumberLE(proof.alpha5);
  const alpha6LEList = proof.alpha6List.map(a => bytesToNumberLE(a))

  const senderPublicKeyU8 = publicKeyToU8(opts.senderPublicKey);
  const recipientPublicKeyU8 = publicKeyToU8(opts.recipientPublicKey);
  const senderPKRistretto = RistrettoPoint.fromHex(senderPublicKeyU8);
  const recipientPKRistretto = RistrettoPoint.fromHex(recipientPublicKeyU8);

  const p = genFiatShamirChallenge(
    utf8ToBytes(FIAT_SHAMIR_SIGMA_DST),
    RistrettoPoint.BASE.toRawBytes(),
    H_RISTRETTO.toRawBytes(),
    senderPublicKeyU8,
    recipientPublicKeyU8,
    ...opts.oldEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...opts.newEncryptedBalance.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...opts.encryptedAmountByRecipient.map(({C, D}) => ([C.toRawBytes(), D.toRawBytes()])).flat(),
    ...auditorDecryptionKeys.flat(),
    proof.X1,
    ...proof.X2List,
    ...proof.X3List,
    ...proof.X4List,
    proof.X5,
    ...proof.X6List,
    ...proofX7List
  );

  const alpha1G = RistrettoPoint.BASE.multiply(alpha1LE);

  const { oldDSum, oldCSum } = opts.oldEncryptedBalance.reduce( (acc, { C, D }, i) => {
    const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI)
    return {
      oldDSum: acc.oldDSum.add(D.multiply(coef)),
      oldCSum: acc.oldCSum.add(C.multiply(coef)),
    }
  }, {oldDSum: RistrettoPoint.ZERO, oldCSum: RistrettoPoint.ZERO })

  const newDSum = opts.newEncryptedBalance.reduce( (acc, { D }, i) => {
    const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI)
    return acc.add(D.multiply(coef))
  }, RistrettoPoint.ZERO)

  const amountCSum = opts.encryptedAmountByRecipient.reduce( (acc, { C }, i) => {
    const coef = 2n ** (BigInt(i) * CHUNK_BITS_BI)
    return acc.add(C.multiply(coef))
  }, RistrettoPoint.ZERO )
  

  const X1 = alpha1G
    .add(oldDSum.multiply(alpha2LE))
    .subtract(newDSum.multiply(alpha2LE))
    .add(oldCSum.multiply(p))
    .subtract(amountCSum.multiply(p));
  const X2List = alpha3LEList.map((a3, i) => 
    senderPKRistretto.multiply(a3).add(opts.newEncryptedBalance[i].D.multiply(p))
  );
  const X3List = alpha3LEList.map((a3, i) => 
    recipientPKRistretto.multiply(a3).add(opts.encryptedAmountByRecipient[i].D.multiply(p))
  );
  const X4List = alpha4LEList.map((a4, i) => {
    const a4G = RistrettoPoint.BASE.multiply(a4)
    const a3H = H_RISTRETTO.multiply(alpha3LEList[i])
    const pC = opts.encryptedAmountByRecipient[i].C.multiply(p)
    return a4G.add(a3H).add(pC)
  });
  const X5 = H_RISTRETTO.multiply(alpha5LE).add(senderPKRistretto.multiply(p));
  const X6List = alpha6LEList.map((a6, i) => {
    const aG = RistrettoPoint.BASE.multiply(a6)
    const aH = H_RISTRETTO.multiply(alpha3LEList[i])
    const pC = opts.newEncryptedBalance[i].C.multiply(p)
    return aG.add(aH).add(pC)
  });
  const X7List = auditorPKs.map((pk, pkI) => 
    alpha3LEList.map((a3, i) =>
      RistrettoPoint.fromHex(pk).multiply(a3)
        .add(RistrettoPoint.fromHex(auditorDecryptionKeys[pkI][i]).multiply(p)
    )
  ))

  return (
    X1.equals(RistrettoPoint.fromHex(proof.X1)) &&
    X2List.every((X2, i) => X2.equals(RistrettoPoint.fromHex(proof.X2List[i]))) &&
    X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(proof.X3List[i]))) &&
    X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(proof.X4List[i]))) &&
    X5.equals(RistrettoPoint.fromHex(proof.X5)) &&
    X6List.every((X6, i) => X6.equals(RistrettoPoint.fromHex(proof.X6List[i]))) &&
    X7List.flat().every((X7, i) => X7.equals(RistrettoPoint.fromHex(proofX7List[i])))
  );
}