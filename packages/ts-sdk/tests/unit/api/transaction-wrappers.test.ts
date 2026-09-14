// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import { AptosConfig } from "../../../src/api/aptosConfig.js";
import { Network } from "../../../src/utils/apiEndpoints.js";
import { Account } from "../../../src/account/Account.js";
import { SimpleTransaction } from "../../../src/transactions/instances/simpleTransaction.js";

vi.mock("../../../src/internal/transaction.js", () => ({
  getTransactions: vi.fn(),
  getTransactionByVersion: vi.fn(),
  getTransactionByHash: vi.fn(),
  isTransactionPending: vi.fn(),
  waitForTransaction: vi.fn(),
  getGasPriceEstimation: vi.fn(),
}));
vi.mock("../../../src/internal/transactionSubmission.js", () => ({
  publicPackageTransaction: vi.fn(),
  signAndSubmitTransaction: vi.fn(),
  signAndSubmitAsFeePayer: vi.fn(),
  getSigningMessage: vi.fn(),
  signTransaction: vi.fn(),
  signAsFeePayer: vi.fn(),
}));
vi.mock("../../../src/internal/account.js", () => ({
  rotateAuthKey: vi.fn(),
  rotateAuthKeyUnverified: vi.fn(),
}));

import { Transaction } from "../../../src/api/transaction.js";
import {
  getTransactions,
  getTransactionByVersion,
  getTransactionByHash,
  isTransactionPending,
  waitForTransaction,
  getGasPriceEstimation,
} from "../../../src/internal/transaction.js";
import {
  publicPackageTransaction,
  signAndSubmitTransaction,
  signAndSubmitAsFeePayer,
  getSigningMessage,
  signTransaction,
  signAsFeePayer,
} from "../../../src/internal/transactionSubmission.js";
import { rotateAuthKey, rotateAuthKeyUnverified } from "../../../src/internal/account.js";
import { AccountAuthenticatorEd25519 } from "../../../src/transactions/authenticator/account.js";

const config = new AptosConfig({ network: Network.LOCAL });
const api = new Transaction(config);
const SENTINEL = "TXN" as never;
const SIGNING_MESSAGE = new Uint8Array([1, 2, 3]);

beforeEach(() => {
  vi.clearAllMocks();
  (publicPackageTransaction as MockedFunction<typeof publicPackageTransaction>).mockResolvedValue(SENTINEL);
  (signAndSubmitTransaction as MockedFunction<typeof signAndSubmitTransaction>).mockResolvedValue({} as never);
  (signAndSubmitAsFeePayer as MockedFunction<typeof signAndSubmitAsFeePayer>).mockResolvedValue({} as never);
  (rotateAuthKey as MockedFunction<typeof rotateAuthKey>).mockResolvedValue(new SimpleTransaction({} as never));
  (rotateAuthKeyUnverified as MockedFunction<typeof rotateAuthKeyUnverified>).mockResolvedValue(
    new SimpleTransaction({} as never),
  );
  (getSigningMessage as MockedFunction<typeof getSigningMessage>).mockReturnValue(SIGNING_MESSAGE);
  (signTransaction as MockedFunction<typeof signTransaction>).mockReturnValue(
    new AccountAuthenticatorEd25519(Account.generate().publicKey, Account.generate().sign(new Uint8Array(32))),
  );
  (signAsFeePayer as MockedFunction<typeof signAsFeePayer>).mockReturnValue(
    new AccountAuthenticatorEd25519(Account.generate().publicKey, Account.generate().sign(new Uint8Array(32))),
  );
});

describe("api/Transaction wrappers", () => {
  it("constructor stores config and exposes sub-modules", () => {
    expect(api.config).toBe(config);
    expect(api.build.config).toBe(config);
    expect(api.simulate.config).toBe(config);
    expect(api.submit.config).toBe(config);
  });

  it("getTransactions forwards aptosConfig", async () => {
    (getTransactions as MockedFunction<typeof getTransactions>).mockResolvedValue([] as never);
    await api.getTransactions({ options: { limit: 5 } });
    expect(getTransactions).toHaveBeenCalledWith({ aptosConfig: config, options: { limit: 5 } });
  });

  it("getTransactionByVersion forwards aptosConfig", async () => {
    (getTransactionByVersion as MockedFunction<typeof getTransactionByVersion>).mockResolvedValue({} as never);
    await api.getTransactionByVersion({ ledgerVersion: 9 });
    expect(getTransactionByVersion).toHaveBeenCalledWith({ aptosConfig: config, ledgerVersion: 9 });
  });

  it("getTransactionByHash forwards aptosConfig", async () => {
    (getTransactionByHash as MockedFunction<typeof getTransactionByHash>).mockResolvedValue({} as never);
    await api.getTransactionByHash({ transactionHash: "0xabc" });
    expect(getTransactionByHash).toHaveBeenCalledWith({ aptosConfig: config, transactionHash: "0xabc" });
  });

  it("isPendingTransaction forwards aptosConfig", async () => {
    (isTransactionPending as MockedFunction<typeof isTransactionPending>).mockResolvedValue(true);
    expect(await api.isPendingTransaction({ transactionHash: "0x1" })).toBe(true);
    expect(isTransactionPending).toHaveBeenCalledWith({ aptosConfig: config, transactionHash: "0x1" });
  });

  it("waitForTransaction forwards aptosConfig", async () => {
    (waitForTransaction as MockedFunction<typeof waitForTransaction>).mockResolvedValue({} as never);
    await api.waitForTransaction({ transactionHash: "0x2" });
    expect(waitForTransaction).toHaveBeenCalledWith({ aptosConfig: config, transactionHash: "0x2" });
  });

  it("getGasPriceEstimation forwards aptosConfig", async () => {
    (getGasPriceEstimation as MockedFunction<typeof getGasPriceEstimation>).mockResolvedValue({
      gas_estimate: 100,
    } as never);
    const est = await api.getGasPriceEstimation();
    expect(est.gas_estimate).toBe(100);
    expect(getGasPriceEstimation).toHaveBeenCalledWith({ aptosConfig: config });
  });

  it("publishPackageTransaction forwards args", async () => {
    const account = Account.generate();
    await api.publishPackageTransaction({
      account,
      metadataBytes: "0x01",
      moduleBytecode: ["0x02"],
    });
    expect(publicPackageTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        aptosConfig: config,
        account,
        metadataBytes: "0x01",
        moduleBytecode: ["0x02"],
      }),
    );
  });

  it("rotateAuthKey forwards args", async () => {
    const fromAccount = Account.generate();
    const toAccount = Account.generate();
    await api.rotateAuthKey({ fromAccount, toAccount });
    expect(rotateAuthKey).toHaveBeenCalledWith({ aptosConfig: config, fromAccount, toAccount });
  });

  it("rotateAuthKeyUnverified forwards args", async () => {
    const fromAccount = Account.generate();
    const toNewPublicKey = Account.generate().publicKey;
    await api.rotateAuthKeyUnverified({ fromAccount, toNewPublicKey });
    expect(rotateAuthKeyUnverified).toHaveBeenCalledWith({ aptosConfig: config, fromAccount, toNewPublicKey });
  });

  it("signAndSubmitTransaction forwards signer + transaction", async () => {
    const signer = Account.generate();
    const transaction = new SimpleTransaction({} as never);
    await api.signAndSubmitTransaction({ signer, transaction });
    expect(signAndSubmitTransaction).toHaveBeenCalledWith({ aptosConfig: config, signer, transaction });
  });

  it("signAndSubmitAsFeePayer forwards fee payer args", async () => {
    const feePayer = Account.generate();
    const senderAuthenticator = new AccountAuthenticatorEd25519(
      Account.generate().publicKey,
      Account.generate().sign(new Uint8Array(32)),
    );
    const transaction = new SimpleTransaction({} as never);
    await api.signAndSubmitAsFeePayer({ feePayer, senderAuthenticator, transaction });
    expect(signAndSubmitAsFeePayer).toHaveBeenCalledWith({
      aptosConfig: config,
      feePayer,
      senderAuthenticator,
      transaction,
    });
  });

  it("getSigningMessage delegates to internal helper", () => {
    const transaction = new SimpleTransaction({} as never);
    const message = api.getSigningMessage({ transaction });
    expect(message).toBe(SIGNING_MESSAGE);
    expect(getSigningMessage).toHaveBeenCalledWith({ transaction });
  });

  it("sign forwards signer and transaction", () => {
    const signer = Account.generate();
    const transaction = new SimpleTransaction({} as never);
    api.sign({ signer, transaction });
    expect(signTransaction).toHaveBeenCalledWith({ signer, transaction });
  });

  it("signAsFeePayer forwards signer and transaction", () => {
    const signer = Account.generate();
    const transaction = new SimpleTransaction({} as never);
    api.signAsFeePayer({ signer, transaction });
    expect(signAsFeePayer).toHaveBeenCalledWith({ signer, transaction });
  });

  it("batchTransactionsForSingleAccount delegates to batch.forSingleAccount", async () => {
    const sender = Account.generate();
    const data = [{ function: "0x1::aptos_account::transfer", functionArguments: ["0x2", 1] }];
    const forSingleAccount = vi.spyOn(api.batch, "forSingleAccount").mockImplementation(() => undefined);

    await api.batchTransactionsForSingleAccount({ sender, data });

    expect(forSingleAccount).toHaveBeenCalledWith({ sender, data, options: undefined });
  });

  it("batchTransactionsForSingleAccount wraps errors from batch.forSingleAccount", async () => {
    vi.spyOn(api.batch, "forSingleAccount").mockImplementation(() => {
      throw new Error("worker down");
    });

    await expect(
      api.batchTransactionsForSingleAccount({
        sender: Account.generate(),
        data: [{ function: "0x1::aptos_account::transfer", functionArguments: ["0x2", 1] }],
      }),
    ).rejects.toThrow(/failed to submit transactions with error: Error: worker down/);
  });
});
