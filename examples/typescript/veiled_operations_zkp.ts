/* eslint-disable no-console */

/**
 * TThis example shows how to generate and verify Sigma ZKP for veiled operations
 */

import {
  TwistedElGamal,
  TwistedEd25519PrivateKey,
  genProofsVeiledWithdraw,
  verifyProofsVeiledWithdraw,
  genProofsVeiledTransfer,
  verifyProofsVeiledTransfer,
  genSigmaProofVeiledKeyRotation,
  verifySigmaProofVeiledKeyRotation,
  RistrettoPoint,
} from "@aptos-labs/ts-sdk";
import { mod } from "@noble/curves/abstract/modular";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex, randomBytes } from "@noble/hashes/utils";

const BALANCE = BigInt(70);
const AMOUNT = BigInt(50);

const example = async () => {
  console.log("Creating a key pairs Twisted ElGamal");

  const privateKeyAlice = TwistedEd25519PrivateKey.generate();
  const privateKeyBob = TwistedEd25519PrivateKey.generate();
  console.log("=== Key pair Alice ===");
  console.log(`Private key: ${privateKeyAlice.toString()}`);
  console.log(`Public key: ${privateKeyAlice.publicKey().toString()}\n\n`);

  console.log("=== Key pair Bob ===");
  console.log(`Private key: ${privateKeyBob.toString()}`);
  console.log(`Public key: ${privateKeyBob.publicKey().toString()}\n\n`);

  const twistedElGamalAliceInstance = new TwistedElGamal(privateKeyAlice);
  const ciphertextAlice = twistedElGamalAliceInstance.encrypt(BALANCE);
  console.log("=== Ciphertext points ===");
  console.log("This ciphertext represents Alice's encrypted balance");
  console.log(`Point C: ${ciphertextAlice.C.toString()}`);
  console.log(`Point D: ${ciphertextAlice.D.toString()}`);

  // Start withdraw prof

  console.log("\n\n=== Veiled Withdraw Proof ===");
  const withdrawProofs = await genProofsVeiledWithdraw({
    privateKey: privateKeyAlice,
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
  });
  console.log("Generated withdraw proofs");
  console.log("Sigma Proof:");
  console.log(bytesToHex(withdrawProofs.sigma), "\n");
  console.log("Range Proof:");
  console.log(bytesToHex(withdrawProofs.range), "\n");

  const rangeProofCommitment = ciphertextAlice.C.subtract(RistrettoPoint.BASE.multiply(AMOUNT));

  const isWithdrawProofsValid = await verifyProofsVeiledWithdraw({
    publicKey: privateKeyAlice.publicKey(),
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    proofs: withdrawProofs,
    rangeProofCommitment: rangeProofCommitment.toRawBytes(),
  });
  console.log("Is veiled withdraw proofs valid:", isWithdrawProofsValid);

  // End withdraw prof
  // Start transfer prof

  console.log("\n\n=== Veiled transfer proofs ===");
  const random = randomBytes(32);
  console.log(`Randomness to encrypt the amount: ${bytesToHex(random)}\n`);

  const amountCiphertext = twistedElGamalAliceInstance.encrypt(AMOUNT, random);
  console.log("The amount encrypted by Alice");
  console.log(`Point C: ${amountCiphertext.C.toString()}`);
  console.log(`Point D: ${amountCiphertext.D.toString()}\n`);

  const transferProofs = await genProofsVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    receiverPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    amount: AMOUNT,
    changedSenderBalance: BALANCE - AMOUNT,
    random,
  });
  console.log("=== Generated transfer proofs ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofs.sigma), "\n");
  console.log("Range Proof for amount:");
  console.log(bytesToHex(transferProofs.rangeAmount), "\n");
  console.log("Range Proof for new balance:");
  console.log(bytesToHex(transferProofs.rangeNewBalance), "\n");

  const rAmount = mod(bytesToNumberLE(random), ed25519.CURVE.n);
  const receiverPKRistretto = RistrettoPoint.fromHex(privateKeyBob.publicKey().toUint8Array());
  const receiverDa = receiverPKRistretto.multiply(rAmount).toRawBytes();
  console.log("The recipient's public key multiplied by the randomness used to encrypt the amount being sent:");
  console.log(bytesToHex(receiverDa), "\n");

  const isTransferProofsValid = await verifyProofsVeiledTransfer({
    senderPublicKey: privateKeyAlice.publicKey(),
    receiverPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    encryptedAmountBySender: amountCiphertext,
    receiverDa,
    proofs: transferProofs,
  });

  console.log("Is veiled transfer proofs valid:", isTransferProofsValid);

  const privateKeyAuditor1 = TwistedEd25519PrivateKey.generate();
  const privateKeyAuditor2 = TwistedEd25519PrivateKey.generate();

  const auditorPublicKeys = [
    privateKeyAuditor1.publicKey().toStringWithoutPrefix(),
    privateKeyAuditor2.publicKey().toStringWithoutPrefix(),
  ];
  const auditorDecryptionKeys = auditorPublicKeys.map((key) => RistrettoPoint.fromHex(key).multiply(rAmount).toHex());

  const transferProofsWithAuditors = await genProofsVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    receiverPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    amount: AMOUNT,
    changedSenderBalance: BALANCE - AMOUNT,
    auditorPublicKeys,
    random,
  });
  console.log("\n=== Generated transfer proofs with auditors ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofsWithAuditors.sigma), "\n");
  console.log("Range Proof for amount:");
  console.log(bytesToHex(transferProofsWithAuditors.rangeAmount), "\n");
  console.log("Range Proof for new balance:");
  console.log(bytesToHex(transferProofsWithAuditors.rangeNewBalance), "\n");

  try {
    const isTransferProofsWithAuditorsValid = await verifyProofsVeiledTransfer({
      senderPublicKey: privateKeyAlice.publicKey(),
      receiverPublicKey: privateKeyBob.publicKey(),
      encryptedSenderBalance: ciphertextAlice,
      encryptedAmountBySender: amountCiphertext,
      receiverDa,
      proofs: transferProofsWithAuditors,
      auditors: {
        publicKeys: auditorPublicKeys,
        decryptionKeys: auditorDecryptionKeys,
      },
    });
    console.log("Is veiled transfer proofs with auditors valid:", isTransferProofsWithAuditorsValid);
  } catch (e) {
    console.log(e);
  }

  // End transfer prof
  // Start key rotation proof

  console.log("\n\n=== Veiled key rotation proof ===");

  const newPrivateKeyAlice = TwistedEd25519PrivateKey.generate();
  console.log("=== The new key pair of Alice's veiled balance ===");
  console.log(`New Private key: ${privateKeyAlice.toString()}`);
  console.log(`New Public key: ${privateKeyAlice.publicKey().toString()}\n`);

  const random2 = randomBytes(32);
  console.log(`Randomness to encrypt the balance: ${bytesToHex(random2)}\n`);
  const newEncryptedBalance = TwistedElGamal.encryptWithPK(BALANCE, newPrivateKeyAlice.publicKey(), random2);
  console.log("Balance encrypted with new public key (ciphertext)");
  console.log(`Point C: ${newEncryptedBalance.C.toString()}`);
  console.log(`Point D: ${newEncryptedBalance.D.toString()}\n`);

  const keyRotationProof = genSigmaProofVeiledKeyRotation({
    oldPrivateKey: privateKeyAlice,
    newPrivateKey: newPrivateKeyAlice,
    balance: BALANCE,
    encryptedBalance: ciphertextAlice,
    random: random2,
  });
  console.log("Generated key rotation proof");
  console.log(bytesToHex(keyRotationProof), "\n");

  const isKeyRotatingProofValid = verifySigmaProofVeiledKeyRotation({
    oldPublicKey: privateKeyAlice.publicKey(),
    newPublicKey: newPrivateKeyAlice.publicKey(),
    oldEncryptedBalance: ciphertextAlice,
    newEncryptedBalance,
    proof: keyRotationProof,
  });

  console.log("Is key rotation proof valid:", isKeyRotatingProofValid);

  // End key rotation proof
};

example();
