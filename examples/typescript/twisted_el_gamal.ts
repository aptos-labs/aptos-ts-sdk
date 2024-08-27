/* eslint-disable no-console */

/**
 * This example shows how a balance can be encrypted and decrypted using the Twisted ElGamal
 */

import { TwistedElGamal, TwistedEd25519PrivateKey } from "@aptos-labs/ts-sdk";

const AMOUNT = BigInt(12_345);

const example = async () => {
  console.log("Creating a key pair Twisted ElGamal");

  const privateKey = TwistedEd25519PrivateKey.generate();
  console.log("=== Key pair ===");
  console.log(`Private key: ${privateKey.toString()}`);
  console.log(`Public key: ${privateKey.publicKey().toString()}\n\n`);

  const twistedElGamalInstance = new TwistedElGamal(privateKey);

  const ciphertext = await twistedElGamalInstance.encrypt(AMOUNT);
  console.log("=== Ciphertext points ===");
  console.log(`Point C: ${ciphertext.C.toString()}`);
  console.log(`Point D: ${ciphertext.D.toString()}\n`);

  console.log("=== Decrypting ciphertext ===");
  console.log("Decrypting the ciphertext using a basic range: from 0 to 2**252");
  const decAmount1 = twistedElGamalInstance.decrypt(ciphertext);
  console.log(`Decrypted amount: ${decAmount1}\n`);

  console.log("Decrypting the ciphertext using a valid range");
  const decAmount2 = twistedElGamalInstance.decrypt(ciphertext, { start: 1_000n, end: 20_000n });
  console.log(`Decrypted amount: ${decAmount2}\n`);

  console.log("Decrypting the ciphertext using a invalid range");
  try {
    twistedElGamalInstance.decrypt(ciphertext, { start: 1_000n, end: 2_000n });
  } catch (e) {
    console.error(e);
    console.log("Failed to decrypt the amount");
  }
};

example();
