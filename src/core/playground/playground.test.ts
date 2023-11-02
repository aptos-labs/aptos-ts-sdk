import { SigningSchemeInput } from "../../types";
import { Account } from "./account";
import { LegacyAccountAuthenticatorMultiEd25519 } from "./accountAuthenticator";
import { LegacyEd25519Account } from "./legacy/ed25519Account";
import { LegacyEd25519Signer } from "./legacy/ed25519Signer";
import { LegacyMultiEd25519PublicKey, LegacyMultiEd25519Signature } from "./legacy/multiEd25519";
import { LegacyMultiEd25519Account } from "./legacy/multiEd25519Account";
import { Signer } from "./signer";

describe("playground", () => {
  test("LegacyEd25519Signer", () => {
    const signer = LegacyEd25519Signer.generate();
    const authenticator = signer.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();

    const account = new LegacyEd25519Account({ publicKey: signer.publicKey, address: signer.address });
    expect(account.verifySignature("0xdeadbeef", authenticator.signature)).toBeTruthy();
  });

  test("DefaultSigner", () => {
    const signer = Signer.generate();
    const authenticator = signer.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();

    const account = new Account({ publicKey: signer.publicKey });
    expect(account.verifySignature("0xdeadbeef", authenticator.signature)).toBeTruthy();
  });

  test("Ed25519Signer", () => {
    const signer = Signer.generate({ scheme: SigningSchemeInput.Ed25519 });
    const authenticator = signer.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();

    const account = new Account({ publicKey: signer.publicKey });
    expect(account.verifySignature("0xdeadbeef", authenticator.signature)).toBeTruthy();
  });

  test("Secp256k1Signer", () => {
    const signer = Signer.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
    const authenticator = signer.sign("0xdeadbeef");
    expect(authenticator.verify("0xdeadbeef")).toBeTruthy();

    const account = new Account({ publicKey: signer.publicKey });
    expect(account.verifySignature("0xdeadbeef", authenticator.signature)).toBeTruthy();
  });

  test("LegacyMultiEd25519Authenticator", () => {
    const signer1 = LegacyEd25519Signer.generate();
    const signer2 = LegacyEd25519Signer.generate();
    const signer3 = LegacyEd25519Signer.generate();
    const multiEd25519PublicKey = new LegacyMultiEd25519PublicKey({
      publicKeys: [signer1.publicKey, signer2.publicKey, signer3.publicKey],
      threshold: 2,
    });

    const multiAccount = new LegacyMultiEd25519Account({ publicKey: multiEd25519PublicKey });

    const message = "0xdeadbeef";
    const authenticator1 = signer1.sign(message);
    const authenticator2 = signer2.sign(message);
    const authenticator3 = signer3.sign(message);

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
      expect(multiAccount.verifySignature(message, multiEd25519Signature)).toBeTruthy();
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
      expect(multiAccount.verifySignature(message, multiEd25519Signature)).toBeFalsy();
    }

    {
      const authenticators = [authenticator1, authenticator2];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeTruthy();
      expect(multiAccount.verifySignature(message, multiEd25519Authenticator.signature)).toBeTruthy();
    }

    {
      const authenticators = [authenticator1, authenticator3];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(multiEd25519Authenticator.verify(message)).toBeTruthy();
      expect(multiAccount.verifySignature(message, multiEd25519Authenticator.signature)).toBeTruthy();
    }

    {
      const authenticators = [authenticator1];
      const multiEd25519Authenticator = new LegacyAccountAuthenticatorMultiEd25519(
        multiEd25519PublicKey,
        authenticators,
      );
      expect(() => multiEd25519Authenticator.verify(message)).toThrow("Not enough signatures");
      expect(() => multiAccount.verifySignature(message, multiEd25519Authenticator.signature)).toThrow(
        "Not enough signatures",
      );
    }
  });
});
