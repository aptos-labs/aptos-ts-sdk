/* eslint-disable no-console */

/**
 * TThis example shows how to generate and verify Sigma ZKP for veiled operations
 */

import {
  TwistedElGamal,
  TwistedEd25519PrivateKey,
  generateVeiledWithdrawProof,
  verifyVeiledWithdrawProof,
  generateVeiledTransferProof,
  verifyVeiledTransferProof,
  generateVeiledKeyRotationProof,
  verifyVeiledKeyRotationProof,
} from "@aptos-labs/ts-sdk";
import { mod } from "@noble/curves/abstract/modular";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";
import { ed25519, RistrettoPoint } from "@noble/curves/ed25519";
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
  const ciphertextAlice = await twistedElGamalAliceInstance.encrypt(BALANCE);
  console.log("=== Ciphertext points ===");
  console.log("This ciphertext represents Alice's encrypted balance");
  console.log(`Point C: ${ciphertextAlice.C.toString()}`);
  console.log(`Point D: ${ciphertextAlice.D.toString()}`);

  // Start withdraw prof

  console.log("\n\n=== Veiled Withdraw Proof ===");
  const withdrawProof = generateVeiledWithdrawProof({
    privateKey: privateKeyAlice,
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    changedBalance: BALANCE - AMOUNT,
  });
  console.log("Generated withdraw proof");
  console.log(
    {
      X1: bytesToHex(withdrawProof.X1),
      X2: bytesToHex(withdrawProof.X2),
      alpha1: bytesToHex(withdrawProof.alpha1),
      alpha2: bytesToHex(withdrawProof.alpha2),
      alpha3: bytesToHex(withdrawProof.alpha3),
    },
    "\n",
  );

  const isWithdrawProfValid = verifyVeiledWithdrawProof({
    publicKey: privateKeyAlice.publicKey(),
    encryptedBalance: ciphertextAlice,
    amount: AMOUNT,
    proof: withdrawProof,
  });
  console.log("Is veiled withdraw proof valid:", isWithdrawProfValid);

  // End withdraw prof
  // Start transfer prof

  console.log("\n\n=== Veiled transfer proof ===");
  const random = randomBytes(32);
  console.log(`Randomness to encrypt the amount: ${bytesToHex(random)}\n`);

  const amountCiphertext = twistedElGamalAliceInstance.encrypt(AMOUNT, random);
  console.log("The amount encrypted by Alice");
  console.log(`Point C: ${amountCiphertext.C.toString()}`);
  console.log(`Point D: ${amountCiphertext.D.toString()}\n`);

  const transferProof = generateVeiledTransferProof({
    senderPrivateKey: privateKeyAlice,
    receiverPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    amount: AMOUNT,
    changedSenderBalance: BALANCE - AMOUNT,
    random,
  });
  console.log("Generated transfer proof");
  console.log(
    {
      X1: bytesToHex(transferProof.X1),
      X2: bytesToHex(transferProof.X2),
      X3: bytesToHex(transferProof.X3),
      X4: bytesToHex(transferProof.X4),
      X5: bytesToHex(transferProof.X5),
      alpha1: bytesToHex(transferProof.alpha1),
      alpha2: bytesToHex(transferProof.alpha2),
      alpha3: bytesToHex(transferProof.alpha3),
      alpha4: bytesToHex(transferProof.alpha4),
      alpha5: bytesToHex(transferProof.alpha5),
    },
    "\n",
  );

  const rAmount = mod(bytesToNumberLE(random), ed25519.CURVE.n);
  const receiverPKRistretto = RistrettoPoint.fromHex(privateKeyBob.publicKey().toUint8Array());
  const receiverDa = receiverPKRistretto.multiply(rAmount).toRawBytes();
  console.log("The recipient's public key multiplied by the randomness used to encrypt the amount being sent:");
  console.log(bytesToHex(receiverDa), "\n");

  const isTransferProofValid = verifyVeiledTransferProof({
    senderPublicKey: privateKeyAlice.publicKey(),
    receiverPublicKey: privateKeyBob.publicKey(),
    encryptedSenderBalance: ciphertextAlice,
    encryptedAmountBySender: amountCiphertext,
    receiverDa,
    proof: transferProof,
  });

  console.log("Is veiled transfer proof valid:", isTransferProofValid);

  // End transfer prof
  // Start key rotation proof

  console.log("\n\n=== Veiled key rotation proof ===");

  const newPrivateKeyAlice = TwistedEd25519PrivateKey.generate();
  console.log("=== The new key pair of Alice's veiled balance ===");
  console.log(`New Private key: ${privateKeyAlice.toString()}`);
  console.log(`New Public key: ${privateKeyAlice.publicKey().toString()}\n`);

  const random2 = randomBytes(32);
  console.log(`Randomness to encrypt the balance: ${bytesToHex(random)}\n`);
  const newEncryptedBalance = TwistedElGamal.encryptWithPK(BALANCE, newPrivateKeyAlice.publicKey(), random2);
  console.log("Balance encrypted with new public key (ciphertext)");
  console.log(`Point C: ${newEncryptedBalance.C.toString()}`);
  console.log(`Point D: ${newEncryptedBalance.D.toString()}\n`);

  const keyRotationProof = generateVeiledKeyRotationProof({
    oldPrivateKey: privateKeyAlice,
    newPrivateKey: newPrivateKeyAlice,
    balance: BALANCE,
    encryptedBalance: ciphertextAlice,
    random: random2,
  });
  console.log("Generated key rotation proof");
  console.log(
    {
      X1: bytesToHex(keyRotationProof.X1),
      X2: bytesToHex(keyRotationProof.X2),
      X3: bytesToHex(keyRotationProof.X3),
      X4: bytesToHex(keyRotationProof.X4),
      alpha1: bytesToHex(keyRotationProof.alpha1),
      alpha2: bytesToHex(keyRotationProof.alpha2),
      alpha3: bytesToHex(keyRotationProof.alpha3),
      alpha4: bytesToHex(keyRotationProof.alpha4),
      alpha5: bytesToHex(keyRotationProof.alpha5),
    },
    "\n",
  );

  const isKeyRotatingProofValid = verifyVeiledKeyRotationProof({
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
