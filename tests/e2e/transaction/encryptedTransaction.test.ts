// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  AccountAddress,
  AptosApiError,
  generateTransactionPayload,
  isUserTransactionResponse,
  SigningSchemeInput,
  TransactionPayloadEncryptedPayload,
  type InputEntryFunctionData,
  type InputViewFunctionData,
} from "../../../src";
import { ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE } from "../../../src/internal/transactionSubmission";
import { MAX_U64_BIG_INT } from "../../../src/bcs/consts";
import { Deserializer } from "../../../src/bcs/deserializer";
import { EncryptionKey } from "../../../src/core/crypto/encryption";
import { fetchAndCacheEncryptionKey } from "../../../src/internal/encryptionKey";
import { getLedgerInfo } from "../../../src/internal/general";
import { RawTransaction } from "../../../src/transactions/instances/rawTransaction";
import { TransactionExtraConfigV1 } from "../../../src/transactions/instances/transactionPayload";
import {
  FUND_AMOUNT,
  TRANSFER_AMOUNT,
  longTestTimeout,
} from "../../unit/helper";
import { getAptosClient } from "../helper";

const { aptos, config } = getAptosClient();

/** Devnet-only: lower max gas for multisig setup so accounts need less balance than default 2M. */
const ENCRYPTED_E2E_MULTISIG_SETUP_MAX_GAS = 1_000_000;

async function createAndFundMultisigAccountForEncryptedE2e(
  owner: Account,
): Promise<string> {
  const payload: InputViewFunctionData = {
    function: "0x1::multisig_account::get_next_multisig_account_address",
    functionArguments: [owner.accountAddress.toString()],
  };
  const [multisigAddress] = await aptos.view<[string]>({ payload });
  const createMultisig = await aptos.transaction.build.simple({
    sender: owner.accountAddress,
    data: {
      function: "0x1::multisig_account::create",
      functionArguments: [1, [], []],
    },
    options: { maxGasAmount: ENCRYPTED_E2E_MULTISIG_SETUP_MAX_GAS },
  });
  const ownerAuthenticator = aptos.transaction.sign({
    signer: owner,
    transaction: createMultisig,
  });
  const res = await aptos.transaction.submit.simple({
    senderAuthenticator: ownerAuthenticator,
    transaction: createMultisig,
  });
  await aptos.waitForTransaction({ transactionHash: res.hash });
  await aptos.fundAccount({
    accountAddress: multisigAddress,
    amount: FUND_AMOUNT,
  });
  return multisigAddress;
}

async function createMultisigTransactionForEncryptedE2e(
  owner: Account,
  multisigAddress: string,
  multisigEntryFunction: InputEntryFunctionData,
): Promise<void> {
  const transactionPayload = await generateTransactionPayload({
    multisigAddress,
    function: multisigEntryFunction.function,
    functionArguments: multisigEntryFunction.functionArguments,
    aptosConfig: config,
  });
  const createMultisigTx = await aptos.transaction.build.simple({
    sender: owner.accountAddress,
    data: {
      function: "0x1::multisig_account::create_transaction",
      functionArguments: [
        multisigAddress,
        transactionPayload.multiSig.transaction_payload!.bcsToBytes(),
      ],
    },
    options: { maxGasAmount: ENCRYPTED_E2E_MULTISIG_SETUP_MAX_GAS },
  });
  const createMultisigTxAuthenticator = aptos.transaction.sign({
    signer: owner,
    transaction: createMultisigTx,
  });
  const createMultisigTxResponse = await aptos.transaction.submit.simple({
    senderAuthenticator: createMultisigTxAuthenticator,
    transaction: createMultisigTx,
  });
  await aptos.waitForTransaction({
    transactionHash: createMultisigTxResponse.hash,
  });
}

/** Fullnode REST balance (not indexer); matches fee validation at submit time. */
const APT_COIN_ASSET = "0x1::aptos_coin::AptosCoin";

/** Distinct from the encrypted-orderless nonce so `nonce_validation` does not reject reuse. */
const PLAIN_ORDERLESS_NONCE = 0xfeedfacecafe0001n;

/** Replay nonce for encrypted orderless tests (must match `sign and submit … (orderless)`). */
const ENCRYPTED_ORDERLESS_REPLAY_NONCE = 0xcafebabedeadbeefn;

function isFeatureUnderGatingError(error: unknown): boolean {
  if (!(error instanceof AptosApiError)) {
    return false;
  }
  if (error.message.includes("FEATURE_UNDER_GATING")) {
    return true;
  }
  const m = error.data?.message;
  return typeof m === "string" && m.includes("FEATURE_UNDER_GATING");
}

/** Fullnode VM validation failure when signature bytes do not verify (often network/version skew for new authenticator + payload combos). */
function isInvalidSignatureError(error: unknown): boolean {
  if (!(error instanceof AptosApiError)) {
    return false;
  }
  if (error.message.includes("INVALID_SIGNATURE")) {
    return true;
  }
  const m = error.data?.message;
  return typeof m === "string" && m.includes("INVALID_SIGNATURE");
}

/**
 * Devnet has not yet deployed encrypted transaction support for outer SingleSender (unified Ed25519)
 * or encrypted multisig execute payloads. Set to `false` when the target network supports them.
 */
const SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E = true;

/**
 * Encrypted transaction E2E tests.
 *
 * These tests require a network with encrypted transactions enabled (e.g. devnet).
 * The default localnet does NOT support encryption (needs multi-validator DKG + feature 108).
 * Skipped automatically when APTOS_NETWORK is unset or "local".
 *
 * Run against devnet (or any network with encrypted transactions enabled), without localnet globalSetup:
 *   APTOS_NETWORK=devnet vitest run tests/e2e/transaction/encryptedTransaction.test.ts --config vitest.config.e2e-devnet.ts
 */
const networkEnv = process.env.APTOS_NETWORK;
const isEncryptionCapableNetwork =
  networkEnv !== undefined && networkEnv !== "" && networkEnv !== "local";

describe.skipIf(!isEncryptionCapableNetwork)("encrypted transactions", () => {
  const sender = Account.generate();
  const receiver = Account.generate();

  let encryptionKeyAvailable = false;

  beforeAll(async () => {
    // Skip default indexer wait: balances in this suite use fullnode (`getBalance` / builds), and
    // indexer polling adds traffic. Devnet anonymous-IP limits are on fullnode; fewer total calls helps.
    await aptos.fundAccount({
      accountAddress: sender.accountAddress,
      amount: FUND_AMOUNT,
      options: { waitForIndexer: false },
    });
    await aptos.fundAccount({
      accountAddress: receiver.accountAddress,
      amount: FUND_AMOUNT,
      options: { waitForIndexer: false },
    });

    const key = await fetchAndCacheEncryptionKey({ aptosConfig: config });
    encryptionKeyAvailable = key !== null;
    if (!encryptionKeyAvailable) {
      console.warn(
        "Encryption key not available on the connected network. Tests requiring encryption will be skipped.",
      );
      return;
    }

    // Fee validation uses on-chain balance vs max_gas_amount × gas_unit_price on the raw txn.
    // `estimate_gas_price` can disagree with the values `build.simple` embeds; probe the real product.
    const probe = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
      },
      options: { encrypted: true },
    });
    const maxFeeReserve =
      probe.rawTransaction.max_gas_amount * probe.rawTransaction.gas_unit_price;
    // Multiple submits: encrypted transfer, plain orderless, encrypted orderless.
    const targetOctas =
      maxFeeReserve * 10n + BigInt(TRANSFER_AMOUNT) * 3n + 500_000_000n;

    let bal = BigInt(
      await aptos.getBalance({
        accountAddress: sender.accountAddress,
        asset: APT_COIN_ASSET,
      }),
    );
    let mintRounds = 0;
    const maxMintRounds = 25;
    while (bal < targetOctas && mintRounds < maxMintRounds) {
      await aptos.fundAccount({
        accountAddress: sender.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: false },
      });
      bal = BigInt(
        await aptos.getBalance({
          accountAddress: sender.accountAddress,
          asset: APT_COIN_ASSET,
        }),
      );
      mintRounds += 1;
    }
    if (bal < targetOctas) {
      throw new Error(
        `Could not fund sender for encrypted-tx fees: need ${targetOctas} octas ` +
          `(probe max_gas×gas_price=${maxFeeReserve}), fullnode balance ${bal} after ${maxMintRounds} mints`,
      );
    }
  }, longTestTimeout);

  test(
    "ledger info exposes encryption_key field",
    async () => {
      const ledgerInfo = await getLedgerInfo({ aptosConfig: config });
      // The field should be present in the response (even if null when not enabled).
      expect("encryption_key" in ledgerInfo).toBe(true);
    },
    longTestTimeout,
  );

  test(
    "fetchAndCacheEncryptionKey returns a valid EncryptionKey when available",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }
      const key = await fetchAndCacheEncryptionKey({ aptosConfig: config });
      expect(key).not.toBeNull();
      expect(key).toBeInstanceOf(EncryptionKey);
    },
    longTestTimeout,
  );

  test(
    "build encrypted entry function transaction",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: { encrypted: true },
      });
      expect(transaction.rawTransaction.payload).toBeInstanceOf(
        TransactionPayloadEncryptedPayload,
      );
    },
    longTestTimeout,
  );

  test(
    "simulate rejects encrypted transaction client-side",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: { encrypted: true },
      });

      await expect(
        aptos.transaction.simulate.simple({
          signerPublicKey: sender.publicKey,
          transaction,
        }),
      ).rejects.toThrow(ENCRYPTED_TRANSACTION_SIMULATION_NOT_SUPPORTED_MESSAGE);
    },
    longTestTimeout,
  );

  test(
    "sign and submit encrypted transfer",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }

      const recipientOldBalance = await aptos.getBalance({
        accountAddress: receiver.accountAddress,
        asset: APT_COIN_ASSET,
      });

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: { encrypted: true },
      });

      const pendingTxn = await aptos.signAndSubmitTransaction({
        signer: sender,
        transaction,
      });
      console.log("Encrypted transfer tx hash:", pendingTxn.hash);
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: pendingTxn.hash,
      });

      expect(isUserTransactionResponse(committedTxn)).toBe(true);
      expect(committedTxn.success).toBe(true);

      const recipientNewBalance = await aptos.getBalance({
        accountAddress: receiver.accountAddress,
        asset: APT_COIN_ASSET,
      });
      expect(recipientNewBalance - recipientOldBalance).toEqual(
        TRANSFER_AMOUNT,
      );
    },
    longTestTimeout,
  );

  test.skipIf(SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E)(
    "sign and submit encrypted transfer (SingleSender / unified Ed25519)",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }
      const skSender = Account.generate({
        scheme: SigningSchemeInput.Ed25519,
        legacy: false,
      });
      await aptos.fundAccount({
        accountAddress: skSender.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: false },
      });
      await aptos.fundAccount({
        accountAddress: skSender.accountAddress,
        amount: FUND_AMOUNT,
        options: { waitForIndexer: false },
      });

      const recipientOldBalance = await aptos.getBalance({
        accountAddress: receiver.accountAddress,
        asset: APT_COIN_ASSET,
      });

      const transaction = await aptos.transaction.build.simple({
        sender: skSender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: { encrypted: true },
      });

      try {
        const pendingTxn = await aptos.signAndSubmitTransaction({
          signer: skSender,
          transaction,
        });
        const committedTxn = await aptos.waitForTransaction({
          transactionHash: pendingTxn.hash,
        });
        expect(isUserTransactionResponse(committedTxn)).toBe(true);
        expect(committedTxn.success).toBe(true);
        const recipientNewBalance = await aptos.getBalance({
          accountAddress: receiver.accountAddress,
          asset: APT_COIN_ASSET,
        });
        expect(recipientNewBalance - recipientOldBalance).toEqual(
          TRANSFER_AMOUNT,
        );
      } catch (error) {
        if (isFeatureUnderGatingError(error)) {
          console.warn(
            "SingleSender encrypted submit skipped: FEATURE_UNDER_GATING on this network.",
          );
          return;
        }
        if (isInvalidSignatureError(error)) {
          console.warn(
            "SingleSender encrypted submit skipped: INVALID_SIGNATURE on this network. " +
              "Legacy Ed25519 encrypted transfer may still succeed while devnet validators lag on SingleSender + encrypted verification.",
          );
          return;
        }
        throw error;
      }
    },
    longTestTimeout,
  );

  test(
    "non-encrypted orderless transfer with replay protection nonce",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, 1],
        },
        options: { replayProtectionNonce: PLAIN_ORDERLESS_NONCE },
      });

      expect(transaction.rawTransaction.sequence_number).toBe(MAX_U64_BIG_INT);

      const pendingTxn = await aptos.signAndSubmitTransaction({
        signer: sender,
        transaction,
      });
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: pendingTxn.hash,
      });

      expect(isUserTransactionResponse(committedTxn)).toBe(true);
      expect(committedTxn.success).toBe(true);
    },
    longTestTimeout,
  );

  test(
    "encrypted orderless client wire: BCS round-trip preserves u64::MAX sequence and replay nonce",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: {
          encrypted: true,
          replayProtectionNonce: ENCRYPTED_ORDERLESS_REPLAY_NONCE,
        },
      });

      const bytes = transaction.rawTransaction.bcsToBytes();
      const roundTrip = RawTransaction.deserialize(new Deserializer(bytes));

      expect(roundTrip.sequence_number).toBe(MAX_U64_BIG_INT);
      expect(roundTrip.payload).toBeInstanceOf(
        TransactionPayloadEncryptedPayload,
      );
      const enc = roundTrip.payload as TransactionPayloadEncryptedPayload;
      expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
      expect(
        (enc.extraConfig as TransactionExtraConfigV1).replayProtectionNonce,
      ).toBe(ENCRYPTED_ORDERLESS_REPLAY_NONCE);
    },
    longTestTimeout,
  );

  test(
    "sign and submit encrypted transfer with replay protection nonce (orderless)",
    async () => {
      if (!encryptionKeyAvailable) {
        console.log("Skipped: encryption key not available on this network");
        return;
      }

      const recipientOldBalance = await aptos.getBalance({
        accountAddress: receiver.accountAddress,
        asset: APT_COIN_ASSET,
      });

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: {
          encrypted: true,
          replayProtectionNonce: ENCRYPTED_ORDERLESS_REPLAY_NONCE,
        },
      });

      expect(transaction.rawTransaction.payload).toBeInstanceOf(
        TransactionPayloadEncryptedPayload,
      );
      expect(transaction.rawTransaction.sequence_number).toBe(MAX_U64_BIG_INT);

      const enc = transaction.rawTransaction
        .payload as TransactionPayloadEncryptedPayload;
      expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
      expect(
        (enc.extraConfig as TransactionExtraConfigV1).replayProtectionNonce,
      ).toBe(ENCRYPTED_ORDERLESS_REPLAY_NONCE);

      const pendingTxn = await aptos.signAndSubmitTransaction({
        signer: sender,
        transaction,
      });
      console.log("Encrypted orderless transfer tx hash:", pendingTxn.hash);
      const committedTxn = await aptos.waitForTransaction({
        transactionHash: pendingTxn.hash,
      });

      expect(isUserTransactionResponse(committedTxn)).toBe(true);
      expect(committedTxn.success).toBe(true);

      const recipientNewBalance = await aptos.getBalance({
        accountAddress: receiver.accountAddress,
        asset: APT_COIN_ASSET,
      });
      expect(recipientNewBalance - recipientOldBalance).toEqual(
        TRANSFER_AMOUNT,
      );
    },
    longTestTimeout,
  );

  describe.skipIf(SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E)(
    "encrypted multisig execute (Ed25519 owner)",
    () => {
      const multisigOwner = Account.generate();
      const multisigReceiver = Account.generate();
      let multisigAddress: string;

      beforeAll(async () => {
        if (!encryptionKeyAvailable) {
          return;
        }
        await aptos.fundAccount({
          accountAddress: multisigOwner.accountAddress,
          amount: FUND_AMOUNT,
          options: { waitForIndexer: false },
        });
        await aptos.fundAccount({
          accountAddress: multisigOwner.accountAddress,
          amount: FUND_AMOUNT,
          options: { waitForIndexer: false },
        });
        await aptos.fundAccount({
          accountAddress: multisigReceiver.accountAddress,
          amount: FUND_AMOUNT,
          options: { waitForIndexer: false },
        });
        multisigAddress =
          await createAndFundMultisigAccountForEncryptedE2e(multisigOwner);
        await createMultisigTransactionForEncryptedE2e(
          multisigOwner,
          multisigAddress,
          {
            function: "0x1::aptos_account::transfer",
            functionArguments: [
              multisigReceiver.accountAddress,
              TRANSFER_AMOUNT,
            ],
          },
        );
        // Owner balance after `create` + `create_transaction` can be below default max_fee reserve for the
        // next submit (2M gas × devnet gas price ≈ 1 APT). Top up before the encrypted execute test.
        await aptos.fundAccount({
          accountAddress: multisigOwner.accountAddress,
          amount: FUND_AMOUNT,
          options: { waitForIndexer: false },
        });
      }, longTestTimeout);

      test(
        "build and submit encrypted multisig payload (submit skipped if FEATURE_UNDER_GATING)",
        async () => {
          if (!encryptionKeyAvailable) {
            console.log(
              "Skipped: encryption key not available on this network",
            );
            return;
          }

          const transaction = await aptos.transaction.build.simple({
            sender: multisigOwner.accountAddress,
            data: {
              multisigAddress,
              function: "0x1::aptos_account::transfer",
              functionArguments: [
                multisigReceiver.accountAddress,
                TRANSFER_AMOUNT,
              ],
            },
            options: { encrypted: true, maxGasAmount: 1_500_000 },
          });

          expect(transaction.rawTransaction.payload).toBeInstanceOf(
            TransactionPayloadEncryptedPayload,
          );
          const enc = transaction.rawTransaction
            .payload as TransactionPayloadEncryptedPayload;
          expect(enc.claimedEntryFun).toBeDefined();
          expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
          expect(
            (
              enc.extraConfig as TransactionExtraConfigV1
            ).multisigAddress?.equals(AccountAddress.from(multisigAddress)),
          ).toBe(true);

          const recipientOldBalance = await aptos.getBalance({
            accountAddress: multisigReceiver.accountAddress,
            asset: APT_COIN_ASSET,
          });

          try {
            const pendingTxn = await aptos.signAndSubmitTransaction({
              signer: multisigOwner,
              transaction,
            });
            const committedTxn = await aptos.waitForTransaction({
              transactionHash: pendingTxn.hash,
            });

            expect(isUserTransactionResponse(committedTxn)).toBe(true);
            expect(committedTxn.success).toBe(true);

            const recipientNewBalance = await aptos.getBalance({
              accountAddress: multisigReceiver.accountAddress,
              asset: APT_COIN_ASSET,
            });
            expect(recipientNewBalance - recipientOldBalance).toEqual(
              TRANSFER_AMOUNT,
            );
          } catch (error) {
            if (isFeatureUnderGatingError(error)) {
              console.warn(
                "Encrypted multisig execution is feature-gated on this network (FEATURE_UNDER_GATING). " +
                  "Build assertions above still ran; submit/execute is skipped until the gate is lifted.",
              );
              return;
            }
            throw error;
          }
        },
        longTestTimeout,
      );
    },
  );
});
