import { Account, Ed25519PrivateKey, TwistedEd25519PrivateKey } from "../../../src";

describe("Decryption key derivation from Private key", () => {
  it("Should derive decryption key from private key", () => {
    const alice = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey("0x9d7669b01809f7486e1710c2050b2aa48fc05f68159e9654277be7490470eb16"),
    });

    const signature = alice.sign(TwistedEd25519PrivateKey.decryptionKeyDerivationMessage);

    const aliceDecryptionKey = TwistedEd25519PrivateKey.fromSignature(signature);

    expect(aliceDecryptionKey.toString()).toEqual("0x9d4c06efdf5a4ea056cc7c9c17137c3f89bb868f9c3ec5b0d3de0bc1d963cf0a");
  });
});
