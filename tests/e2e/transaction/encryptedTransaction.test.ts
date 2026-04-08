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
import { describe, expect, test, type TestContext } from "vitest";
import { FUND_AMOUNT, TRANSFER_AMOUNT, longTestTimeout } from "../../unit/helper";
import { getAptosClient } from "../helper";

const { aptos, config } = getAptosClient();

/** Shown in Vitest output when encrypted tests are skipped (public devnet often has no `encryption_key`). */
const SKIP_ENCRYPTED_TESTS_REASON =
  "Fullnode ledger has no encryption_key — encrypted transaction e2e did not run. " +
  "Use a network with encrypted transactions enabled, or set APTOS_NODE_API_URL to a node that exposes encryption_key. " +
  "Set REQUIRE_ENCRYPTION_E2E=1 to fail instead of skip when the key is missing.";

/**
 * Encrypted **fee-payer** builds: pass `feePayerAuthenticationKey` (32-byte hex of the sponsor's auth key) when
 * `feePayerAddress` is non-zero, so AAD matches `TransactionAuthenticator::all_signer_auth_keys`. No dedicated e2e here
 * yet (same network gating as other encrypted submits); validate with unit tests + a capable node when needed.
 */

/** VM floor for encrypted txs (aptos-core `encrypted_txn_min_price_per_gas_unit`, often 200 when base min is 100). */
const ENCRYPTED_TXN_MIN_GAS_UNIT_PRICE = 200n;

/**
 * Capped max gas for encrypted e2e so `max_gas × gas_unit_price` stays within devnet faucet limits
 * (default 2M × 200 would require several APT reserved).
 */
const ENCRYPTED_E2E_DEFAULT_MAX_GAS = 600_000;

/** Required for `options.encrypted` builds: must match the authenticator that will sign the transaction. */
function encryptedBuildOptions(account: Account, extra: Record<string, unknown> = {}) {
  return {
    encrypted: true as const,
    authenticationKey: Account.authKey({ publicKey: account.publicKey }).data.toString(),
    gasUnitPrice: ENCRYPTED_TXN_MIN_GAS_UNIT_PRICE,
    maxGasAmount: ENCRYPTED_E2E_DEFAULT_MAX_GAS,
    ...extra,
  };
}

/** Devnet-only: lower max gas for multisig setup so accounts need less balance than default 2M. */
const ENCRYPTED_E2E_MULTISIG_SETUP_MAX_GAS = 1_000_000;

async function createAndFundMultisigAccountForEncryptedE2e(owner: Account): Promise<string> {
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
      functionArguments: [multisigAddress, transactionPayload.multiSig.transaction_payload!.bcsToBytes()],
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

function isEncryptedMultisigUnsupportedError(error: unknown): boolean {
  if (!(error instanceof AptosApiError)) {
    return false;
  }
  if (error.message.includes("Encrypted transactions do not support multisig")) {
    return true;
  }
  const m = error.data?.message;
  return typeof m === "string" && m.includes("Encrypted transactions do not support multisig");
}

/**
 * Encrypted **SingleSender** (unified Ed25519) and **encrypted multisig execute** e2e are skipped by
 * default because public devnet often lacks them. Set **`RUN_ENCRYPTED_NON_LEGACY_E2E=1`** when your
 * fullnode and validators support these paths (same network as `encryption_key`).
 */
const SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E = process.env.RUN_ENCRYPTED_NON_LEGACY_E2E !== "1";

/**
 * Encrypted transaction E2E tests.
 *
 * These tests require a fullnode whose **ledger** response includes a non-empty **`encryption_key`**
 * (per-epoch batch-encryption key). Public **devnet** often returns `encryption_key: null`, in which case
 * encrypted cases are reported as **skipped** (not vacuously "passed").
 *
 * The default localnet started by the main Vitest config does NOT support encryption (needs DKG + gating).
 * This file is usually run with **`vitest.config.e2e-devnet.ts`** (no Docker globalSetup).
 *
 * ```bash
 * pnpm e2e-encrypted
 * ```
 *
 * **No skips (all cases run):** use a fullnode whose ledger returns a non-null **`encryption_key`**
 * (public devnet often does not). Point **`APTOS_NODE_API_URL`** at that fullnode, require the key,
 * and opt into non-legacy cases:
 *
 * ```bash
 * APTOS_NETWORK=devnet \
 * APTOS_NODE_API_URL=https://your-encryption-capable-fullnode.example/v1 \
 * REQUIRE_ENCRYPTION_E2E=1 \
 * RUN_ENCRYPTED_NON_LEGACY_E2E=1 \
 * pnpm e2e-encrypted
 * ```
 *
 * Fail the run if the key must be present (CI against an encryption-capable endpoint) without the
 * non-legacy opt-in:
 * ```bash
 * REQUIRE_ENCRYPTION_E2E=1 APTOS_NETWORK=devnet ... pnpm e2e-encrypted
 * ```
 */
const networkEnv = process.env.APTOS_NETWORK;
const isEncryptionCapableNetwork = networkEnv !== undefined && networkEnv !== "" && networkEnv !== "local";

describe.skipIf(!isEncryptionCapableNetwork)("encrypted transactions", () => {
  const sender = Account.generate();
  const receiver = Account.generate();

  let encryptionKeyAvailable = false;

  function skipUnlessEncryptionKeyAvailable(c: Pick<TestContext, "skip">): void {
    c.skip(!encryptionKeyAvailable, SKIP_ENCRYPTED_TESTS_REASON);
  }

  /** Top up sender until balance covers on-chain fee checks (uses fullnode balance, not indexer). */
  async function fundSenderUntilAtLeast(targetOctas: bigint, errDetail: string): Promise<void> {
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
        `Could not fund sender: need ${targetOctas} octas (${errDetail}), fullnode balance ${bal} after ${maxMintRounds} mints`,
      );
    }
  }

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

    const fetched = await fetchAndCacheEncryptionKey({ aptosConfig: config });
    encryptionKeyAvailable = fetched !== null;
    if (!encryptionKeyAvailable) {
      if (process.env.REQUIRE_ENCRYPTION_E2E === "1") {
        throw new Error(
          `REQUIRE_ENCRYPTION_E2E=1 but fetchAndCacheEncryptionKey returned null. ${SKIP_ENCRYPTED_TESTS_REASON}`,
        );
      }
      console.warn(SKIP_ENCRYPTED_TESTS_REASON);
      // Still fund for `non-encrypted orderless …` (same shape as that test) when encryption is absent.
      const probePlain = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, 1],
        },
        options: { replayProtectionNonce: PLAIN_ORDERLESS_NONCE },
      });
      const maxFeeReserve = probePlain.rawTransaction.max_gas_amount * probePlain.rawTransaction.gas_unit_price;
      await fundSenderUntilAtLeast(
        maxFeeReserve * 5n + 100_000_000n,
        `plain orderless probe max_gas×gas_price=${maxFeeReserve}`,
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
      options: encryptedBuildOptions(sender),
    });
    const maxFeeReserve = probe.rawTransaction.max_gas_amount * probe.rawTransaction.gas_unit_price;
    // Multiple submits: encrypted transfer, plain orderless, encrypted orderless.
    const targetOctas = maxFeeReserve * 10n + BigInt(TRANSFER_AMOUNT) * 3n + 500_000_000n;
    await fundSenderUntilAtLeast(targetOctas, `encrypted probe max_gas×gas_price=${maxFeeReserve}`);
  }, longTestTimeout);

  test(
    "ledger info exposes encryption_key field",
    async () => {
      const ledgerInfo = await getLedgerInfo({ aptosConfig: config });
      // The field should be present in the response (even if null when not enabled).
      expect("encryption_key" in ledgerInfo).toBe(true);
      if (process.env.REQUIRE_ENCRYPTION_E2E === "1") {
        expect(ledgerInfo.encryption_key, "encryption_key must be set when REQUIRE_ENCRYPTION_E2E=1").toBeTruthy();
      }
    },
    longTestTimeout,
  );

  test(
    "fetchAndCacheEncryptionKey returns key and epoch when available",
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);
      const fetched = await fetchAndCacheEncryptionKey({ aptosConfig: config });
      expect(fetched).not.toBeNull();
      expect(fetched!.key).toBeInstanceOf(EncryptionKey);
      expect(typeof fetched!.epoch).toBe("bigint");
    },
    longTestTimeout,
  );

  test(
    "build encrypted entry function transaction",
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: encryptedBuildOptions(sender),
      });
      expect(transaction.rawTransaction.payload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
    },
    longTestTimeout,
  );

  test(
    "simulate rejects encrypted transaction client-side",
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);
      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: encryptedBuildOptions(sender),
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
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);

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
        options: encryptedBuildOptions(sender),
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
      expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );

  test.skipIf(SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E)(
    "sign and submit encrypted transfer (SingleSender / unified Ed25519)",
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);
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
        options: encryptedBuildOptions(skSender),
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
        expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
      } catch (error) {
        if (isFeatureUnderGatingError(error)) {
          console.warn("SingleSender encrypted submit skipped: FEATURE_UNDER_GATING on this network.");
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
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);

      const transaction = await aptos.transaction.build.simple({
        sender: sender.accountAddress,
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
        },
        options: encryptedBuildOptions(sender, {
          replayProtectionNonce: ENCRYPTED_ORDERLESS_REPLAY_NONCE,
        }),
      });

      const bytes = transaction.rawTransaction.bcsToBytes();
      const roundTrip = RawTransaction.deserialize(new Deserializer(bytes));

      expect(roundTrip.sequence_number).toBe(MAX_U64_BIG_INT);
      expect(roundTrip.payload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
      const enc = roundTrip.payload as TransactionPayloadEncryptedPayload;
      expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
      expect((enc.extraConfig as TransactionExtraConfigV1).replayProtectionNonce).toBe(
        ENCRYPTED_ORDERLESS_REPLAY_NONCE,
      );
    },
    longTestTimeout,
  );

  test(
    "sign and submit encrypted transfer with replay protection nonce (orderless)",
    async (c) => {
      skipUnlessEncryptionKeyAvailable(c);

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
        options: encryptedBuildOptions(sender, {
          replayProtectionNonce: ENCRYPTED_ORDERLESS_REPLAY_NONCE,
        }),
      });

      expect(transaction.rawTransaction.payload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
      expect(transaction.rawTransaction.sequence_number).toBe(MAX_U64_BIG_INT);

      const enc = transaction.rawTransaction.payload as TransactionPayloadEncryptedPayload;
      expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
      expect((enc.extraConfig as TransactionExtraConfigV1).replayProtectionNonce).toBe(
        ENCRYPTED_ORDERLESS_REPLAY_NONCE,
      );

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
      expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
    },
    longTestTimeout,
  );

  describe.skipIf(SKIP_ENCRYPTED_NON_LEGACY_AUTHENTICATOR_E2E)("encrypted multisig execute (Ed25519 owner)", () => {
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
      multisigAddress = await createAndFundMultisigAccountForEncryptedE2e(multisigOwner);
      await createMultisigTransactionForEncryptedE2e(multisigOwner, multisigAddress, {
        function: "0x1::aptos_account::transfer",
        functionArguments: [multisigReceiver.accountAddress, TRANSFER_AMOUNT],
      });
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
      async (c) => {
        skipUnlessEncryptionKeyAvailable(c);

        const transaction = await aptos.transaction.build.simple({
          sender: multisigOwner.accountAddress,
          data: {
            multisigAddress,
            function: "0x1::aptos_account::transfer",
            functionArguments: [multisigReceiver.accountAddress, TRANSFER_AMOUNT],
          },
          options: encryptedBuildOptions(multisigOwner, { maxGasAmount: 1_500_000 }),
        });

        expect(transaction.rawTransaction.payload).toBeInstanceOf(TransactionPayloadEncryptedPayload);
        const enc = transaction.rawTransaction.payload as TransactionPayloadEncryptedPayload;
        expect(enc.claimedEntryFun).toBeDefined();
        expect(enc.extraConfig).toBeInstanceOf(TransactionExtraConfigV1);
        expect(
          (enc.extraConfig as TransactionExtraConfigV1).multisigAddress?.equals(AccountAddress.from(multisigAddress)),
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
          expect(recipientNewBalance - recipientOldBalance).toEqual(TRANSFER_AMOUNT);
        } catch (error) {
          if (isFeatureUnderGatingError(error)) {
            console.warn(
              "Encrypted multisig execution is feature-gated on this network (FEATURE_UNDER_GATING). " +
                "Build assertions above still ran; submit/execute is skipped until the gate is lifted.",
            );
            return;
          }
          if (isEncryptedMultisigUnsupportedError(error)) {
            console.warn(
              "This network rejects encrypted multisig at submission (API). " +
                "Build assertions above still ran; execute is skipped until multisig + encrypted is supported.",
            );
            return;
          }
          throw error;
        }
      },
      longTestTimeout,
    );
  });
});
