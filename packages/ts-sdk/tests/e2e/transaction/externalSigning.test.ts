// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Tests that verify the external signer flow works correctly in the latest SDK version.
 * This addresses the reported issue where transactions signed by external signers
 * (e.g., Fireblocks) fail with "Invalid Auth Key" or "Transaction Expired" errors.
 *
 * The flow tested: build → getSigningMessage → sign externally → submit
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import {
  Account,
  AccountAuthenticatorEd25519,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  SimpleTransaction,
  AccountAuthenticator,
  generateSigningMessageForTransaction,
} from "../../../src/index.js";
import { longTestTimeout } from "../../unit/helper.js";
import { getAptosClient } from "../helper.js";
import { fundAccounts } from "./helper.js";

const { aptos } = getAptosClient();

describe("external signing", () => {
  const sender = Account.generate();
  const receiver = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [sender, receiver]);
  }, longTestTimeout);

  test(
    "submits a transaction signed externally using ed25519 (legacy AccountAuthenticatorEd25519)",
    async () => {
      // 1. Build the transaction (this is what the "server" would do)
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, 100],
        },
      });

      // 2. Get the signing message (bytes to sign)
      const signingMessage = generateSigningMessageForTransaction(transaction);

      // 3. Sign with raw ed25519 (simulating an external signer like Fireblocks)
      const privateKeyBytes = sender.privateKey.toUint8Array();
      const signatureBytes = ed25519.sign(signingMessage, privateKeyBytes);

      // 4. Construct the authenticator
      const publicKey = sender.publicKey as Ed25519PublicKey;
      const signature = new Ed25519Signature(signatureBytes);

      // Verify signature locally before submitting
      const isValid = publicKey.verifySignature({ message: signingMessage, signature });
      expect(isValid).toBe(true);

      const authenticator = new AccountAuthenticatorEd25519(publicKey, signature);

      // 5. Submit the transaction
      const response = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: authenticator,
      });

      // 6. Wait for confirmation
      const result = await aptos.waitForTransaction({ transactionHash: response.hash });
      expect(result.success).toBe(true);
    },
    longTestTimeout,
  );

  test(
    "submits a transaction signed externally via BCS serialization round-trip (like the external_signing example)",
    async () => {
      // This test mirrors the flow in examples/typescript/external_signing.ts
      // where the transaction is BCS-encoded, sent to an external signer,
      // deserialized, signed, and the authenticator is BCS-encoded back.

      // 1. Build the transaction on the "server"
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, 100],
        },
      });

      // 2. BCS encode the transaction (to send to external signer)
      const encodedTransaction = transaction.bcsToBytes();

      // 3. External signer: deserialize, get signing message, sign
      const deserializedTx = SimpleTransaction.deserialize(new Deserializer(encodedTransaction));
      const signingMessage = aptos.getSigningMessage({ transaction: deserializedTx });

      const privateKeyBytes = sender.privateKey.toUint8Array();
      const signatureBytes = ed25519.sign(signingMessage, privateKeyBytes);

      const publicKey = sender.publicKey as Ed25519PublicKey;
      const authenticator = new AccountAuthenticatorEd25519(publicKey, new Ed25519Signature(signatureBytes));

      // 4. BCS encode the authenticator (to send back to server)
      const authenticatorBytes = authenticator.bcsToBytes();

      // 5. Server: deserialize the authenticator
      const deserializedAuthenticator = AccountAuthenticator.deserialize(new Deserializer(authenticatorBytes));

      // 6. Submit using the original transaction object
      const response = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: deserializedAuthenticator,
      });

      const result = await aptos.waitForTransaction({ transactionHash: response.hash });
      expect(result.success).toBe(true);
    },
    longTestTimeout,
  );

  test(
    "submits a transaction using getSigningMessage from the Aptos client",
    async () => {
      // This test uses aptos.getSigningMessage() (the public API method)
      // instead of the direct generateSigningMessageForTransaction import

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, 100],
        },
      });

      const signingMessage = aptos.getSigningMessage({ transaction });

      const privateKeyBytes = sender.privateKey.toUint8Array();
      const signatureBytes = ed25519.sign(signingMessage, privateKeyBytes);

      const publicKey = sender.publicKey as Ed25519PublicKey;
      const signature = new Ed25519Signature(signatureBytes);
      const authenticator = new AccountAuthenticatorEd25519(publicKey, signature);

      const response = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: authenticator,
      });

      const result = await aptos.waitForTransaction({ transactionHash: response.hash });
      expect(result.success).toBe(true);
    },
    longTestTimeout,
  );
});
