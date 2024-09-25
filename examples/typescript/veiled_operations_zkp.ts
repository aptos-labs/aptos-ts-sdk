/* eslint-disable no-console */

/**
 * TThis example shows how to generate and verify Sigma ZKP for veiled operations
 */

import {
  TwistedElGamal,
  TwistedEd25519PrivateKey,
  genProofVeiledWithdraw,
  verifyProofVeiledWithdraw,
  genProofVeiledTransfer,
  verifyProofVeiledTransfer,
  genSigmaProofVeiledKeyRotation,
  verifySigmaProofVeiledKeyRotation,
  RistrettoPoint,
} from "@aptos-labs/ts-sdk";
import { bytesToHex } from "@noble/hashes/utils";

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
  const withdrawProof = await genProofVeiledWithdraw({
    privateKey: privateKeyAlice,
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
  });
  console.log("Generated withdraw proof");
  console.log("Sigma Proof:");
  console.log(bytesToHex(withdrawProof.sigma), "\n");
  console.log("Range Proof:");
  console.log(bytesToHex(withdrawProof.range), "\n");

  const rangeProofCommitment = ciphertextAlice.C.subtract(RistrettoPoint.BASE.multiply(AMOUNT));

  const isWithdrawProofValid = await verifyProofVeiledWithdraw({
    publicKey: privateKeyAlice.publicKey(),
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    proof: withdrawProof,
    rangeProofCommitment: rangeProofCommitment.toRawBytes(),
  });
  console.log("Is veiled withdraw proof valid:", isWithdrawProofValid);

  // End withdraw prof
  // Start transfer prof

  console.log("\n\n=== Veiled transfer proof ===");

  const transferProofOutput = await genProofVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    recipientPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    amount: AMOUNT,
    changedSenderBalance: BALANCE - AMOUNT,
  });
  console.log("=== Generated transfer proof ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofOutput.proof.sigma), "\n");
  console.log("Range Proof for amount:");
  console.log(bytesToHex(transferProofOutput.proof.rangeAmount), "\n");
  console.log("Range Proof for new balance:");
  console.log(bytesToHex(transferProofOutput.proof.rangeNewBalance), "\n");

  const isTransferProofValid = await verifyProofVeiledTransfer({
    senderPublicKey: privateKeyAlice.publicKey(),
    recipientPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    encryptedAmountBySender: transferProofOutput.encryptedAmountBySender,
    maskedRecipientPublicKey: transferProofOutput.maskedRecipientPublicKey,
    proof: transferProofOutput.proof,
  });

  console.log("Is veiled transfer proof valid:", isTransferProofValid);

  const privateKeyAuditor1 = TwistedEd25519PrivateKey.generate();
  const privateKeyAuditor2 = TwistedEd25519PrivateKey.generate();

  const auditorPublicKeys = [privateKeyAuditor1.publicKey(), privateKeyAuditor2.publicKey()];

  const transferProofWithAuditorsOutputs = await genProofVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    recipientPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    amount: AMOUNT,
    changedSenderBalance: BALANCE - AMOUNT,
    auditorPublicKeys,
  });
  console.log("\n=== Generated transfer proof with auditors ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofWithAuditorsOutputs.proof.sigma), "\n");
  console.log("Range Proof for amount:");
  console.log(bytesToHex(transferProofWithAuditorsOutputs.proof.rangeAmount), "\n");
  console.log("Range Proof for new balance:");
  console.log(bytesToHex(transferProofWithAuditorsOutputs.proof.rangeNewBalance), "\n");

  try {
    const isTransferProofWithAuditorsValid = await verifyProofVeiledTransfer({
      senderPublicKey: privateKeyAlice.publicKey(),
      recipientPublicKey: privateKeyBob.publicKey(),
      encryptedSenderBalance: ciphertextAlice,
      encryptedAmountBySender: transferProofWithAuditorsOutputs.encryptedAmountBySender,
      maskedRecipientPublicKey: transferProofWithAuditorsOutputs.maskedRecipientPublicKey,
      proof: transferProofWithAuditorsOutputs.proof,
      auditors: {
        publicKeys: auditorPublicKeys,
        decryptionKeys: transferProofWithAuditorsOutputs.maskedAuditorsPublicKeys,
      },
    });
    console.log("Is veiled transfer proof with auditors valid:", isTransferProofWithAuditorsValid);
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

  const keyRotationProofOutputs = genSigmaProofVeiledKeyRotation({
    oldPrivateKey: privateKeyAlice,
    newPrivateKey: newPrivateKeyAlice,
    balance: BALANCE,
    encryptedBalance: ciphertextAlice,
  });
  console.log("Generated key rotation proof");
  console.log(bytesToHex(keyRotationProofOutputs.proof), "\n");

  const isKeyRotatingProofValid = verifySigmaProofVeiledKeyRotation({
    oldPublicKey: privateKeyAlice.publicKey(),
    newPublicKey: newPrivateKeyAlice.publicKey(),
    oldEncryptedBalance: ciphertextAlice,
    newEncryptedBalance: keyRotationProofOutputs.encryptedBalanceByNewPublicKey,
    proof: keyRotationProofOutputs.proof,
  });

  console.log("Is key rotation proof valid:", isKeyRotatingProofValid);

  // End key rotation proof
};

example();
