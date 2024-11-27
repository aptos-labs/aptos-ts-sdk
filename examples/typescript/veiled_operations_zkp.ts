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
  amountToChunks,
  genProofVeiledKeyRotation,
  verifyProofVeiledKeyRotation,
  genProofVeiledNormalization,
  verifyProofVeiledNormalization,
  chunksToAmount
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
  const ciphertextAlice = amountToChunks(BALANCE, 4).map(chunk => twistedElGamalAliceInstance.encrypt(chunk));
  console.log("=== Ciphertext points ===");
  console.log("This ciphertext represents Alice's encrypted balance");
  console.log("Points of ciphertext:");
  console.log(ciphertextAlice.map(({ C, D }) => ({ C: C.toString(), D: D.toString()})));

  // Start withdraw prof
  console.log("\n\n=== Veiled Withdraw Proof ===");
  const withdrawOutputs = await genProofVeiledWithdraw({
    privateKey: privateKeyAlice,
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
  });
  console.log("Generated withdraw proof");
  console.log("Sigma Proof:");
  console.log(bytesToHex(withdrawOutputs.proof.sigma), "\n");

  const isWithdrawProofValid = await verifyProofVeiledWithdraw({
    publicKey: privateKeyAlice.publicKey(),
    oldEncryptedBalance: ciphertextAlice,
    newEncryptedBalance: withdrawOutputs.newEncryptedBalance,
    amount: AMOUNT,
    proof: withdrawOutputs.proof,
  });
  console.log("Is veiled withdraw proof valid:", isWithdrawProofValid);

  // End withdraw prof
  // Start transfer prof

  console.log("\n\n=== Veiled transfer proof ===");

  const transferProofOutput = await genProofVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    recipientPublicKey: privateKeyBob.publicKey(),
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
  });
  console.log("=== Generated transfer proof ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofOutput.proof.sigma), "\n");

  const isTransferProofValid = await verifyProofVeiledTransfer({
    senderPublicKey: privateKeyAlice.publicKey(),
    recipientPublicKey: privateKeyBob.publicKey(),
    oldEncryptedBalance: ciphertextAlice,
    newEncryptedBalance: transferProofOutput.newEncryptedBalance,
    encryptedAmountByRecipient: transferProofOutput.encryptedAmountByRecipient,
    proof: transferProofOutput.proof,
  });

  console.log("Is veiled transfer proof valid:", isTransferProofValid);

  const privateKeyAuditor1 = TwistedEd25519PrivateKey.generate();
  const privateKeyAuditor2 = TwistedEd25519PrivateKey.generate();

  const auditorPublicKeys = [privateKeyAuditor1.publicKey(), privateKeyAuditor2.publicKey()];

  const transferProofWithAuditorsOutputs = await genProofVeiledTransfer({
    senderPrivateKey: privateKeyAlice,
    recipientPublicKey: privateKeyBob.publicKey(),
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
    auditorPublicKeys,
  });
  console.log("\n=== Generated transfer proof with auditors ===");
  console.log("Sigma Proof:");
  console.log(bytesToHex(transferProofWithAuditorsOutputs.proof.sigma), "\n");

  try {
    const isTransferProofWithAuditorsValid = await verifyProofVeiledTransfer({
      senderPublicKey: privateKeyAlice.publicKey(),
      recipientPublicKey: privateKeyBob.publicKey(),
      oldEncryptedBalance: ciphertextAlice,
      newEncryptedBalance: transferProofWithAuditorsOutputs.newEncryptedBalance,
      encryptedAmountByRecipient: transferProofWithAuditorsOutputs.encryptedAmountByRecipient,
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

  const keyRotationProofOutputs = await genProofVeiledKeyRotation({
    oldPrivateKey: privateKeyAlice,
    newPrivateKey: newPrivateKeyAlice,
    balance: BALANCE,
    oldEncryptedBalance: ciphertextAlice,
  });
  console.log("Generated key rotation proof");
  console.log(bytesToHex(keyRotationProofOutputs.proof.sigma), "\n");

  const isKeyRotatingProofValid = await verifyProofVeiledKeyRotation({
    oldPublicKey: privateKeyAlice.publicKey(),
    newPublicKey: newPrivateKeyAlice.publicKey(),
    oldEncryptedBalance: ciphertextAlice,
    newEncryptedBalance: keyRotationProofOutputs.newEncryptedBalance,
    proof: keyRotationProofOutputs.proof,
  });

  console.log("Is key rotation proof valid:", isKeyRotatingProofValid);

  // End key rotation proof
  // Start normalization proof

  const unnormalizedBalanceChunks = [2n**32n + 100n, 2n**32n + 200n, 2n**32n + 300n, 0n]
  const unnormalizedEncryptedBalanceAlice = unnormalizedBalanceChunks.map(chunk => twistedElGamalAliceInstance.encrypt(chunk));
  console.log("\n\n=== Veiled normalization proof ===");
  const normalizationProofOutputs = await genProofVeiledNormalization({
    privateKey: privateKeyAlice,
    encryptedBalance: unnormalizedEncryptedBalanceAlice,
    balance: chunksToAmount(unnormalizedBalanceChunks),
  });
  console.log("Generated normalization proof");
  console.log(bytesToHex(normalizationProofOutputs.proof.sigma), "\n");

  const isNormalizationProofValid = await verifyProofVeiledNormalization({
    publicKey: privateKeyAlice.publicKey(),
    encryptedBalance: unnormalizedEncryptedBalanceAlice,
    normalizedEncryptedBalance: normalizationProofOutputs.normalizedEncryptedBalance,
    proof: normalizationProofOutputs.proof,
  });

  console.log("Is normalization proof valid:", isNormalizationProofValid);

  // End normalization proof
};

example();
