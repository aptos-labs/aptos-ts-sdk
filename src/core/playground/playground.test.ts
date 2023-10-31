import { LegacyAccountAuthenticatorMultiEd25519 } from "./accountAuthenticator";
import { LegacyEd25519Signer } from "./legacy/ed25519Signer";
import { LegacyMultiEd25519PublicKey, LegacyMultiEd25519Signature } from "./legacy/multiEd25519";
import { Signer } from "./signer";
import { SignatureScheme } from "./scheme";

describe("playground", () => {
  test("LegacyEd25519Signer", () => {
    const account = LegacyEd25519Signer.generate();
    const authenticator = account.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();
  });

  test("DefaultSigner", () => {
    const account = Signer.generate();
    const authenticator = account.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();
  });

  test("Ed25519Signer", () => {
    const account = Signer.generate({ scheme: SignatureScheme.Ed25519 });
    const authenticator = account.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();
  });

  test("Secp256k1Signer", () => {
    const account = Signer.generate({ scheme: SignatureScheme.Secp256k1 });
    const authenticator = account.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();
  });

  test("LegacyMultiEd25519Authenticator", () => {
    const account1 = LegacyEd25519Signer.generate();
    const account2 = LegacyEd25519Signer.generate();
    const account3 = LegacyEd25519Signer.generate();
    const multiEd25519PublicKey = new LegacyMultiEd25519PublicKey({
      publicKeys: [account1.publicKey, account2.publicKey, account3.publicKey],
      threshold: 2,
    });

    const message = "0xdeadbeef";
    const authenticator1 = account1.sign(message);
    const authenticator2 = account2.sign(message);
    const authenticator3 = account3.sign(message);

    {
      const multiEd25519Signature = new LegacyMultiEd25519Signature({
        signatures: [authenticator1.signature, authenticator2.signature],
        bitmap: [0, 1],
      });
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        multiEd25519Signature,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeTruthy();
    }

    {
      const multiEd25519Signature = new LegacyMultiEd25519Signature({
        signatures: [authenticator1.signature, authenticator2.signature],
        bitmap: [0, 2],
      });
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        multiEd25519Signature,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeFalsy();
    }

    {
      const authenticators = [authenticator1, authenticator2];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeTruthy();
    }

    {
      const authenticators = [authenticator1, authenticator3];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeTruthy();
    }

    {
      const authenticators = [authenticator1];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(() => multiEd25519Authenticator.verify(message)).toThrow("Not enough signatures");
    }
  });
});
