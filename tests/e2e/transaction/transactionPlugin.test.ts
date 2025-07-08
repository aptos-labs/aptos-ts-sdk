// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AptosConfig,
  TransactionSubmitter,
  PendingTransactionResponse,
  TransactionResponseType,
  InputSubmitTransactionData,
} from "../../../src";
import { getAptosClient } from "../helper";
import { fundAccounts, publishTransferPackage } from "./helper";
import { longTestTimeout } from "../../unit/helper";

// Global state to track plugin calls
interface PluginCallData {
  callCount: number;
  lastCall?: {
    transaction: any;
    senderAuthenticator: any;
    feePayerAuthenticator?: any;
    additionalSignersAuthenticators?: any;
    pluginParams?: Record<string, any>;
  };
}

const pluginCallTracker: PluginCallData = {
  callCount: 0,
  lastCall: undefined,
};

// Reset both trackers between tests
function resetPluginTracker() {
  pluginCallTracker.callCount = 0;
  pluginCallTracker.lastCall = undefined;
  overridePluginCallTracker.callCount = 0;
  overridePluginCallTracker.lastCall = undefined;
}

// Dummy TransactionSubmitter implementation for testing
class MockTransactionSubmitter implements TransactionSubmitter {
  constructor(private identifier: string = "default") {}

  async submitTransaction(
    args: {
      aptosConfig: AptosConfig;
    } & InputSubmitTransactionData,
  ): Promise<PendingTransactionResponse> {
    const { transaction, senderAuthenticator, feePayerAuthenticator, additionalSignersAuthenticators, pluginParams } =
      args;

    // Track the call
    pluginCallTracker.callCount++;
    pluginCallTracker.lastCall = {
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
      additionalSignersAuthenticators,
      pluginParams,
    };

    // Return fake response data with identifier in hash for testing
    const hashSuffix = this.identifier === "override" ? "override123" : "1234567890abcdef";
    return {
      type: TransactionResponseType.Pending,
      hash: `0x${hashSuffix}1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`.slice(0, 66),
      sender: transaction.rawTransaction.sender.toString(),
      sequence_number: transaction.rawTransaction.sequence_number.toString(),
      max_gas_amount: transaction.rawTransaction.max_gas_amount.toString(),
      gas_unit_price: transaction.rawTransaction.gas_unit_price.toString(),
      expiration_timestamp_secs: transaction.rawTransaction.expiration_timestamp_secs.toString(),
      payload: {} as any,
    };
  }
}

// Additional tracker for override submitter
const overridePluginCallTracker: PluginCallData = {
  callCount: 0,
  lastCall: undefined,
};

// Override TransactionSubmitter implementation for testing
class OverrideTransactionSubmitter implements TransactionSubmitter {
  async submitTransaction(
    args: {
      aptosConfig: AptosConfig;
    } & InputSubmitTransactionData,
  ): Promise<PendingTransactionResponse> {
    const { transaction, senderAuthenticator, feePayerAuthenticator, additionalSignersAuthenticators, pluginParams } =
      args;

    // Track the call in override tracker
    overridePluginCallTracker.callCount++;
    overridePluginCallTracker.lastCall = {
      transaction,
      senderAuthenticator,
      feePayerAuthenticator,
      additionalSignersAuthenticators,
      pluginParams,
    };

    // Return fake response data with different hash to distinguish from default
    return {
      type: TransactionResponseType.Pending,
      hash: "0xoverride567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      sender: transaction.rawTransaction.sender.toString(),
      sequence_number: transaction.rawTransaction.sequence_number.toString(),
      max_gas_amount: transaction.rawTransaction.max_gas_amount.toString(),
      gas_unit_price: transaction.rawTransaction.gas_unit_price.toString(),
      expiration_timestamp_secs: transaction.rawTransaction.expiration_timestamp_secs.toString(),
      payload: {} as any,
    };
  }
}

describe("transaction plugin", () => {
  const { aptos } = getAptosClient();
  const contractPublisherAccount = Account.generate();
  const senderAccount = Account.generate();
  const receiverAccount = Account.generate();
  const otherAccount = Account.generate();

  beforeAll(async () => {
    await fundAccounts(aptos, [contractPublisherAccount, senderAccount, receiverAccount, otherAccount]);
    await publishTransferPackage(aptos, contractPublisherAccount);
  }, longTestTimeout);

  beforeEach(() => {
    resetPluginTracker();
  });

  describe("ignore transaction submitter", () => {
    test("setIgnoreTransactionSubmitter toggles behavior correctly", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      // First, verify plugin is used by default
      let transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      let response = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: aptos.transaction.sign({ signer: senderAccount, transaction }),
      });

      expect(pluginCallTracker.callCount).toBe(1);
      expect(response.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

      // Now ignore the plugin
      aptos.setIgnoreTransactionSubmitter(true);
      resetPluginTracker();

      transaction = await aptos.transaction.build.simple({
        sender: otherAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [2, receiverAccount.accountAddress],
        },
      });

      response = await aptos.signAndSubmitTransaction({
        signer: otherAccount,
        transaction,
      });

      expect(pluginCallTracker.callCount).toBe(0);
      expect(response.hash).not.toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

      // Re-enable the plugin
      aptos.setIgnoreTransactionSubmitter(false);
      resetPluginTracker();

      transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [3, receiverAccount.accountAddress],
        },
      });

      response = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator: aptos.transaction.sign({ signer: senderAccount, transaction }),
      });

      expect(pluginCallTracker.callCount).toBe(1);
      expect(response.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });
  });

  describe("TransactionSubmitter plugin", () => {
    test("uses plugin when configured", async () => {
      // Create a new config with the mock plugin
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      // Build a simple transaction
      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      // Use signAndSubmitTransaction to test plugin integration
      const testPluginParams = { recaptchaToken: "test-token", customParam: "test-value" };

      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
        pluginParams: testPluginParams,
      });

      // Verify plugin was called
      expect(pluginCallTracker.callCount).toBe(1);
      expect(pluginCallTracker.lastCall).toBeDefined();
      expect(pluginCallTracker.lastCall!.transaction).toBe(transaction);
      expect(pluginCallTracker.lastCall!.pluginParams).toEqual(testPluginParams);

      // Verify response came from plugin (fake hash)
      expect(response.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });

    test("passes through all parameters to plugin", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      // Build a fee payer transaction
      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      const testPluginParams = {
        recaptchaToken: "fee-payer-token",
        userId: "12345",
      };

      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
        pluginParams: testPluginParams,
      });

      // Verify all parameters were passed
      expect(pluginCallTracker.callCount).toBe(1);
      expect(pluginCallTracker.lastCall).toBeDefined();
      expect(pluginCallTracker.lastCall!.transaction).toBe(transaction);
      expect(pluginCallTracker.lastCall!.senderAuthenticator).toBeDefined();
      expect(pluginCallTracker.lastCall!.pluginParams).toEqual(testPluginParams);

      // Verify response came from plugin (fake hash)
      expect(response.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });

    test("uses plugin for multi-agent transactions", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });
      const secondarySignerAccount = Account.generate();

      // Build a multi-agent transaction
      const transaction = await aptos.transaction.build.multiAgent({
        sender: senderAccount.accountAddress,
        secondarySignerAddresses: [secondarySignerAccount.accountAddress],
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
          functionArguments: [100, 200, receiverAccount.accountAddress, secondarySignerAccount.accountAddress, 50],
        },
      });

      // For multi-agent, we need to use the Submit class directly since signAndSubmitTransaction
      // doesn't handle multi-agent. We'll just verify the plugin works for basic functionality.
      const senderAuthenticator = aptos.transaction.sign({ signer: senderAccount, transaction });
      const secondaryAuthenticator = aptos.transaction.sign({ signer: secondarySignerAccount, transaction });

      const response = await aptos.transaction.submit.multiAgent({
        transaction,
        senderAuthenticator,
        additionalSignersAuthenticators: [secondaryAuthenticator],
      });

      // Verify plugin was called with multi-agent parameters
      expect(pluginCallTracker.callCount).toBe(1);
      expect(pluginCallTracker.lastCall).toBeDefined();
      expect(pluginCallTracker.lastCall!.additionalSignersAuthenticators).toHaveLength(1);
      expect(pluginCallTracker.lastCall!.additionalSignersAuthenticators![0]).toBe(secondaryAuthenticator);

      // Verify response came from plugin (fake hash)
      expect(response.hash).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });
  });

  describe("no plugin configured", () => {
    test("uses default submission when no plugin is configured", async () => {
      // Use default config without plugin
      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
      });

      // Verify plugin was not called
      expect(pluginCallTracker.callCount).toBe(0);

      // Verify real transaction was submitted
      expect(response.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Wait for transaction to complete to verify it was real
      await aptos.waitForTransaction({ transactionHash: response.hash });
    });
  });

  describe("transactionSubmitter field override", () => {
    test("overrides configured submitter with transactionSubmitter field", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      const overrideSubmitter = new OverrideTransactionSubmitter();

      // Build a simple transaction
      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      // Submit with override submitter
      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
        transactionSubmitter: overrideSubmitter,
        pluginParams: { test: "override" },
      });

      // Verify override submitter was called, not the configured one
      expect(pluginCallTracker.callCount).toBe(0); // Default submitter should not be called
      expect(overridePluginCallTracker.callCount).toBe(1);
      expect(overridePluginCallTracker.lastCall).toBeDefined();
      expect(overridePluginCallTracker.lastCall!.pluginParams).toEqual({ test: "override" });

      // Verify response came from override submitter
      expect(response.hash).toBe("0xoverride567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });

    test("ignores configured submitter when transactionSubmitter is set to null", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      // Build a simple transaction
      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      // Submit with null transactionSubmitter to ignore configured submitter
      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
        transactionSubmitter: null,
        pluginParams: { test: "null-override" },
      });

      // Verify neither plugin was called
      expect(pluginCallTracker.callCount).toBe(0);
      expect(overridePluginCallTracker.callCount).toBe(0);

      // Verify real transaction was submitted (not from plugin)
      expect(response.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(response.hash).not.toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
      expect(response.hash).not.toBe("0xoverride567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

      // Wait for transaction to complete to verify it was real
      await aptos.waitForTransaction({ transactionHash: response.hash });
    });

    test("uses override submitter when no default submitter is configured", async () => {
      // Use default config without plugin
      const overrideSubmitter = new OverrideTransactionSubmitter();

      const transaction = await aptos.transaction.build.simple({
        sender: senderAccount.accountAddress,
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::transfer`,
          functionArguments: [1, receiverAccount.accountAddress],
        },
      });

      // Submit with override submitter when no default is configured
      const response = await aptos.signAndSubmitTransaction({
        signer: senderAccount,
        transaction,
        transactionSubmitter: overrideSubmitter,
        pluginParams: { test: "no-default-config" },
      });

      // Verify override submitter was called
      expect(pluginCallTracker.callCount).toBe(0); // No default configured
      expect(overridePluginCallTracker.callCount).toBe(1);
      expect(overridePluginCallTracker.lastCall).toBeDefined();
      expect(overridePluginCallTracker.lastCall!.pluginParams).toEqual({ test: "no-default-config" });

      // Verify response came from override submitter
      expect(response.hash).toBe("0xoverride567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });

    test("override submitter works with multi-agent transactions", async () => {
      const { aptos } = getAptosClient({
        pluginSettings: {
          TRANSACTION_SUBMITTER: new MockTransactionSubmitter(),
        },
      });

      const overrideSubmitter = new OverrideTransactionSubmitter();
      const secondarySignerAccount = Account.generate();

      // Build a multi-agent transaction
      const transaction = await aptos.transaction.build.multiAgent({
        sender: senderAccount.accountAddress,
        secondarySignerAddresses: [secondarySignerAccount.accountAddress],
        data: {
          function: `${contractPublisherAccount.accountAddress}::transfer::two_by_two`,
          functionArguments: [100, 200, receiverAccount.accountAddress, secondarySignerAccount.accountAddress, 50],
        },
      });

      const senderAuthenticator = aptos.transaction.sign({ signer: senderAccount, transaction });
      const secondaryAuthenticator = aptos.transaction.sign({ signer: secondarySignerAccount, transaction });

      const response = await aptos.transaction.submit.multiAgent({
        transaction,
        senderAuthenticator,
        additionalSignersAuthenticators: [secondaryAuthenticator],
        transactionSubmitter: overrideSubmitter,
        pluginParams: { test: "multi-agent-override" },
      });

      // Verify override submitter was called with multi-agent parameters
      expect(pluginCallTracker.callCount).toBe(0); // Default submitter should not be called
      expect(overridePluginCallTracker.callCount).toBe(1);
      expect(overridePluginCallTracker.lastCall).toBeDefined();
      expect(overridePluginCallTracker.lastCall!.additionalSignersAuthenticators).toHaveLength(1);
      expect(overridePluginCallTracker.lastCall!.pluginParams).toEqual({ test: "multi-agent-override" });

      // Verify response came from override submitter
      expect(response.hash).toBe("0xoverride567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });
  });
});
