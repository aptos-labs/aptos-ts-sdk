// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * End-to-end tests for the keyless decryption-key (DK) backup integration (aptos-core PR #19458).
 *
 * These are GATED on framework support: the `account::encrypted_dk_exists` /
 * `account::get_encrypted_dk` view functions and the `register_ek_and_encrypt_dk` /
 * `upsert_ed25519_backup_key_and_encrypt_dk` entry functions only exist once the localnet's bundled
 * framework includes PR #19458. Until then, the suite probes for support in `beforeAll` and skips.
 *
 * NOTE: A full `register_ek_and_encrypt_dk` / `upsert_ed25519_backup_key_and_encrypt_dk` flow
 * requires a real keyless + Ed25519-backup multi-key account (OIDC + proving service), which this
 * localnet harness does not set up. The cryptographic core (AEAD round-trip, decrypt known-answer,
 * and the RotationProofChallenge proof format) is covered by the unit suite
 * (`tests/units/dkEncryption.test.mts`); the on-chain register/upsert paths are validated via the
 * Petra integration / a keyless-enabled environment.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { Account } from "@aptos-labs/ts-sdk";
import { aptos, confidentialAsset, longTestTimeout } from "../helpers/index.mjs";

let frameworkSupported = false;

beforeAll(async () => {
  try {
    await aptos.view<[boolean]>({
      payload: {
        function: "0x1::account::encrypted_dk_exists",
        functionArguments: [Account.generate().accountAddress.toString()],
      },
    });
    frameworkSupported = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Skipping keyless DK-backup e2e: framework (PR #19458) not available on this localnet.", String(e));
    frameworkSupported = false;
  }
}, longTestTimeout);

describe("keyless DK backup (e2e, gated on framework support)", () => {
  it(
    "reports no encrypted DK for a fresh account",
    async (ctx) => {
      if (!frameworkSupported) ctx.skip();

      const fresh = Account.generate();
      await aptos.fundAccount({ accountAddress: fresh.accountAddress, amount: 100_000_000 });

      const exists = await confidentialAsset.encryptedDkExists({ accountAddress: fresh.accountAddress });
      expect(exists).toBe(false);

      const ciphertext = await confidentialAsset.getEncryptedDk({ accountAddress: fresh.accountAddress });
      expect(ciphertext).toBeUndefined();
    },
    longTestTimeout,
  );
});
