import {
  Account,
  Deserializer,
  U64,
  SigningSchemeInput,
  AccountAuthenticator,
  AccountAuthenticatorEd25519,
  AccountAuthenticatorSingleKey,
  Secp256r1PrivateKey,
  WebAuthnSignature,
  AnySignature,
  AnyPublicKey,
  generateSigningMessageForTransaction,
  Hex,
} from "../../../src";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { sha3_256 } from "@noble/hashes/sha3";
import { longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { fundAccounts, publishTransferPackage, singleSignerScriptBytecode } from "./helper";

const { aptos } = getAptosClient();

describe("sign transaction", () => {
  const contractPublisherAccount = Account.generate();
  const singleSignerED25519SenderAccount = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const legacyED25519SenderAccount = Account.generate();
  const receiverAccounts = [Account.generate(), Account.generate()];
  const singleSignerSecp256k1Account = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      contractPublisherAccount,
      singleSignerED25519SenderAccount,
      legacyED25519SenderAccount,
      singleSignerSecp256k1Account,
      ...receiverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);

  describe("it returns the current account authenticator", () => {
    describe("Single Sender ED25519", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
    });
    describe("Single Sender Secp256k1", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerSecp256k1Account,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: singleSignerSecp256k1Account.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: singleSignerED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorSingleKey).toBeTruthy();
      });
    });
    describe("Legacy ED25519", () => {
      test("it signs a script transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            bytecode: singleSignerScriptBytecode,
            functionArguments: [new U64(1), receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs an entry function transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
      test("it signs a multi sig transaction", async () => {
        const rawTxn = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        const accountAuthenticator = aptos.transaction.sign({
          signer: legacyED25519SenderAccount,
          transaction: rawTxn,
        });
        expect(accountAuthenticator instanceof AccountAuthenticator).toBeTruthy();
        const deserializer = new Deserializer(accountAuthenticator.bcsToBytes());
        const authenticator = AccountAuthenticator.deserialize(deserializer);
        expect(authenticator instanceof AccountAuthenticatorEd25519).toBeTruthy();
      });
    });
    describe("validate fee payer data on sign transaction", () => {
      test("it fails to sign transaction as fee payer if transaction is not a fee payer transaction", async () => {
        const transaction = await aptos.transaction.build.simple({
          sender: legacyED25519SenderAccount.accountAddress,
          data: {
            function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
            functionArguments: [1, receiverAccounts[0].accountAddress],
          },
        });
        expect(() =>
          aptos.transaction.signAsFeePayer({
            transaction,
            signer: legacyED25519SenderAccount,
          }),
        ).toThrow();
      });
    });
  });

  describe("WebAuthn Signature", () => {
    test("it creates and validates WebAuthn signature", async () => {
      // Simple base64url encoder
      const toB64 = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
      const b64urlEncode = (u8: Uint8Array) => toB64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      // Generate a Secp256r1 key pair
      const privateKey = Secp256r1PrivateKey.generate();
      const publicKey = privateKey.publicKey();

      // Create a simple transaction for signing
      const transaction = await aptos.transaction.build.simple({
        sender: publicKey.authKey().derivedAddress(),
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: ["0x1", 1],
        },
        options: {
          gasUnitPrice: 100,
          maxGasAmount: 2000,
        },
      });

      // Generate signing message and WebAuthn client data
      const message = generateSigningMessageForTransaction(transaction);
      const challenge = sha3_256(message);
      const clientDataObj = {
        type: "webauthn.get",
        challenge: b64urlEncode(challenge),
        origin: "http://localhost:5173",
        crossOrigin: false,
      } as const;
      const clientDataJSON = new TextEncoder().encode(JSON.stringify(clientDataObj));

      // Fixed authenticator data
      const authenticatorData = new Uint8Array([
        73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199,
        153, 92, 243, 186, 131, 29, 151, 99, 29, 0, 0, 0, 0,
      ]);

      // Compute WebAuthn digest and sign with P-256
      const clientHash = sha256(clientDataJSON);
      const toBeSigned = new Uint8Array(authenticatorData.length + clientHash.length);
      toBeSigned.set(authenticatorData, 0);
      toBeSigned.set(clientHash, authenticatorData.length);
      const webauthnDigest = sha256(toBeSigned);
      const privBytes = Hex.fromHexInput(privateKey.toHexString()).toUint8Array();
      const sig = p256.sign(webauthnDigest, privBytes);
      const signatureBytes = sig.toCompactRawBytes();

      // Create WebAuthn signature
      const webAuthnSignature = new WebAuthnSignature(signatureBytes, authenticatorData, clientDataJSON);

      // Test serialization/deserialization
      const serializer = new Deserializer(webAuthnSignature.bcsToBytes());
      const deserializedSignature = WebAuthnSignature.deserialize(serializer);

      expect(deserializedSignature.authenticatorData.toUint8Array()).toEqual(authenticatorData);
      expect(deserializedSignature.clientDataJSON.toUint8Array()).toEqual(clientDataJSON);
    });

    test("it creates AccountAuthenticatorSingleKey with WebAuthn signature", async () => {
      // Simple base64url encoder
      const toB64 = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
      const b64urlEncode = (u8: Uint8Array) => toB64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      const privateKey = Secp256r1PrivateKey.generate();
      const publicKey = privateKey.publicKey();

      const transaction = await aptos.transaction.build.simple({
        sender: publicKey.authKey().derivedAddress(),
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: ["0x1", 1],
        },
      });

      // Create WebAuthn signature components with correct challenge and real signature
      const message = generateSigningMessageForTransaction(transaction);
      const challenge = sha3_256(message);
      const clientDataObj = {
        type: "webauthn.get",
        challenge: b64urlEncode(challenge),
        origin: "http://localhost:5173",
        crossOrigin: false,
      } as const;
      const clientDataJSON = new TextEncoder().encode(JSON.stringify(clientDataObj));
      const authenticatorData = new Uint8Array([
        73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199,
        153, 92, 243, 186, 131, 29, 151, 99, 29, 0, 0, 0, 0,
      ]);

      const clientHash = sha256(clientDataJSON);
      const toBeSigned = new Uint8Array(authenticatorData.length + clientHash.length);
      toBeSigned.set(authenticatorData, 0);
      toBeSigned.set(clientHash, authenticatorData.length);
      const webauthnDigest = sha256(toBeSigned);
      const privBytes = Hex.fromHexInput(privateKey.toHexString()).toUint8Array();
      const sig = p256.sign(webauthnDigest, privBytes);
      const signatureBytes = sig.toCompactRawBytes();

      const webAuthnSignature = new WebAuthnSignature(signatureBytes, authenticatorData, clientDataJSON);

      // Create account authenticator
      const anySignature = new AnySignature(webAuthnSignature);
      const anyPublicKey = new AnyPublicKey(publicKey);
      const accountAuthenticator = new AccountAuthenticatorSingleKey(anyPublicKey, anySignature);

      expect(accountAuthenticator).toBeInstanceOf(AccountAuthenticatorSingleKey);
      expect(accountAuthenticator.public_key).toBeInstanceOf(AnyPublicKey);
      expect(accountAuthenticator.signature).toBeInstanceOf(AnySignature);
    });
  });
});
