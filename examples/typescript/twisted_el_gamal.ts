/* eslint-disable no-console */

/**
 * This example shows how a balance can be encrypted and decrypted using the Twisted ElGamal
 */

import { TwistedElGamal, TwistedEd25519PrivateKey } from "@aptos-labs/ts-sdk";

const AMOUNT = BigInt(12_345);

const example = async () => {
  console.log("Creating a key pair Twisted ElGamal");

  const privateKeyAlice = TwistedEd25519PrivateKey.generate();
  console.log("=== Key pair ===");
  console.log(`Private key: ${privateKeyAlice.toString()}`);
  console.log(`Public key: ${privateKeyAlice.publicKey().toString()}\n\n`);

  const twistedElGamalAliceInstance = new TwistedElGamal(privateKeyAlice);

  const ciphertextAlice = await twistedElGamalAliceInstance.encrypt(AMOUNT);
  console.log("=== Ciphertext points ===");
  console.log(`Point C: ${ciphertextAlice.C.toString()}`);
  console.log(`Point D: ${ciphertextAlice.D.toString()}\n`);

  console.log("=== Decrypting ciphertext ===");
  console.log("Decrypting the ciphertext using a basic range: from 0 to 2**252");
  const decAmount1 = twistedElGamalAliceInstance.decrypt(ciphertextAlice);
  console.log(`Decrypted amount: ${decAmount1}\n`);

  console.log("Decrypting the ciphertext using a valid range");
  const decAmount2 = twistedElGamalAliceInstance.decrypt(ciphertextAlice, { start: 1_000n, end: 20_000n });
  console.log(`Decrypted amount: ${decAmount2}\n`);

  console.log("Decrypting the ciphertext using a invalid range");
  try {
    twistedElGamalAliceInstance.decrypt(ciphertextAlice, { start: 1_000n, end: 2_000n });
  } catch (e) {
    console.error(e);
    console.log("Failed to decrypt the amount\n");
  }

  console.log("=== Modify ciphertext ===");
  console.log("Modify ciphertext by amount 1000n");
  const modifiedCiphertext1 = TwistedElGamal.modifyCiphertextByAmount(ciphertextAlice, "add", 1000n);
  const decModifiedCiphertext1 = twistedElGamalAliceInstance.decrypt(modifiedCiphertext1);
  console.log(`Decrypted modified ciphertext: ${decModifiedCiphertext1}\n`);

  console.log("Modify ciphertext by ciphertext");
  const modifiedCiphertext2 = TwistedElGamal.modifyCiphertextByCiphertext(
    ciphertextAlice,
    "add",
    twistedElGamalAliceInstance.encrypt(1000n),
  );
  const decModifiedCiphertext2 = twistedElGamalAliceInstance.decrypt(modifiedCiphertext2);
  console.log(`Decrypted modified ciphertext: ${decModifiedCiphertext2}\n`);

  console.log("Modify ciphertext by ciphertext encrypted with different public keys");
  console.log("This is not recommended, as the resulting ciphertext cannot be decrypted");
  const privateKeyBob = TwistedEd25519PrivateKey.generate();
  const ciphertextBob = TwistedElGamal.encryptWithPK(1000n, privateKeyBob.publicKey());

  const modifiedCiphertext3 = TwistedElGamal.modifyCiphertextByCiphertext(ciphertextAlice, "add", ciphertextBob);
  try {
    TwistedElGamal.decryptWithPK(modifiedCiphertext3, privateKeyAlice, { start: 10_000n, end: 20_000n });
  } catch (e) {
    console.log("Failed to decrypt the ciphertext with privateKeyAlice");
  }

  try {
    TwistedElGamal.decryptWithPK(modifiedCiphertext3, privateKeyBob, { start: 10_000n, end: 20_000n });
  } catch (e) {
    console.log("Failed to decrypt the ciphertext with privateKeyBob\n");
  }
};

example();
