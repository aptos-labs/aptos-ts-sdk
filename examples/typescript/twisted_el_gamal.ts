/* eslint-disable no-console */

/**
 * This example shows how a balance can be encrypted and decrypted using the Twisted ElGamal
 */

import { TwistedElGamal, TwistedEd25519PrivateKey } from "@aptos-labs/ts-sdk";

const AMOUNT = BigInt(12345)


const example = async () => {
  console.log("Creating a key pair Twisted ElGamal");

  const privateKey = TwistedEd25519PrivateKey.generate()
  console.log("=== Key pair ===");
  console.log(`Private key: ${privateKey.toString()}`);
  console.log(`Pablic key: ${privateKey.publicKey().toString()}\n\n`);

  const twistedElGamalInstance = new TwistedElGamal(privateKey)

  const ciphertext = await twistedElGamalInstance.encrypt(AMOUNT)
  console.log("=== Ciphertext points ===");
  console.log(`Point C: ${ciphertext.C.toString()}`);
  console.log(`Point D: ${ciphertext.D.toString()}\n`);

  console.log("=== Decrypting ciphertext ===");
  console.log("Decrypting the ciphertext starting from 0 amount");
  const decAmount1 = twistedElGamalInstance.decrypt(ciphertext)
  console.log(`Decrypted amount: ${decAmount1}\n`);

  console.log("Decrypting the ciphertext starting at a specified amount");
  const decAmount2 = twistedElGamalInstance.decrypt(ciphertext, 1000n)
  console.log(`Decrypted amount: ${decAmount2}`);
};


example();
