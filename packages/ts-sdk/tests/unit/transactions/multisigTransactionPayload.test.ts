// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { Deserializer } from "../../../src/bcs/deserializer";
import { AccountAddress } from "../../../src/core";
import {
  convertPayloadToInnerPayload,
  generateTransactionPayload,
} from "../../../src/transactions/transactionBuilder/transactionBuilder";
import {
  EntryFunction,
  MultiSig,
  MultiSigTransactionPayload,
  Script,
  TransactionExecutableScript,
  TransactionInnerPayloadV1,
  TransactionPayloadMultiSig,
} from "../../../src/transactions/instances/transactionPayload";
import { MultiSigTransactionPayloadVariants } from "../../../src/types/types";

describe("MultiSigTransactionPayload BCS (aptos-core multisig.rs parity)", () => {
  test("round-trips EntryFunction variant", () => {
    const entry = EntryFunction.build("0x1::coin", "transfer", [], []);
    const mstp = new MultiSigTransactionPayload(entry);
    const bytes = mstp.bcsToBytes();
    expect(bytes[0]).toBe(MultiSigTransactionPayloadVariants.EntryFunction);
    const restored = MultiSigTransactionPayload.deserialize(new Deserializer(bytes));
    expect(restored.transaction_payload).toBeInstanceOf(EntryFunction);
    expect(restored.bcsToBytes()).toEqual(bytes);
  });

  test("round-trips Script variant", () => {
    const script = new Script(new Uint8Array([0xde, 0xad]), [], []);
    const mstp = new MultiSigTransactionPayload(script);
    const bytes = mstp.bcsToBytes();
    expect(bytes[0]).toBe(MultiSigTransactionPayloadVariants.Script);
    const restored = MultiSigTransactionPayload.deserialize(new Deserializer(bytes));
    expect(restored.transaction_payload).toBeInstanceOf(Script);
    expect(restored.bcsToBytes()).toEqual(bytes);
  });

  test("deserialize rejects unknown variant", () => {
    const bad = new Uint8Array([99]);
    expect(() => MultiSigTransactionPayload.deserialize(new Deserializer(bad))).toThrow(
      "Unknown MultisigTransactionPayload variant",
    );
  });

  test("convertPayloadToInnerPayload maps multisig script to TransactionExecutableScript", () => {
    const script = new Script(new Uint8Array([1]), [], []);
    const msAddr = AccountAddress.ONE;
    const payload = new TransactionPayloadMultiSig(new MultiSig(msAddr, new MultiSigTransactionPayload(script)));
    const inner = convertPayloadToInnerPayload(payload, 777n);
    expect(inner).toBeInstanceOf(TransactionInnerPayloadV1);
    const v1 = inner as TransactionInnerPayloadV1;
    expect(v1.executable).toBeInstanceOf(TransactionExecutableScript);
    expect((v1.executable as TransactionExecutableScript).script.bytecode).toEqual(script.bytecode);
  });
});

describe("generateTransactionPayload with InputMultiSigScriptData", () => {
  test("returns TransactionPayloadMultiSig when multisigAddress is provided with bytecode", async () => {
    const bytecode = new Uint8Array([0xca, 0xfe]);
    const multisigAddress = AccountAddress.ONE;
    const result = await generateTransactionPayload({ bytecode, functionArguments: [], multisigAddress });
    expect(result).toBeInstanceOf(TransactionPayloadMultiSig);
    const ms = result as TransactionPayloadMultiSig;
    expect(ms.multiSig.multisig_address).toEqual(multisigAddress);
    expect(ms.multiSig.transaction_payload?.transaction_payload).toBeInstanceOf(Script);
    const script = ms.multiSig.transaction_payload?.transaction_payload as Script;
    expect(script.bytecode).toEqual(bytecode);
  });

  test("wrapping does not include a plain TransactionPayloadScript — the script is nested inside multisig", async () => {
    const result = await generateTransactionPayload({
      bytecode: new Uint8Array([0x01]),
      functionArguments: [],
      multisigAddress: AccountAddress.ONE,
    });
    // Must be the multisig wrapper, not the bare script payload
    expect(result).toBeInstanceOf(TransactionPayloadMultiSig);
    expect(result).not.toBeInstanceOf(Script);
    // The script lives one level deeper, inside MultiSigTransactionPayload
    const inner = (result as TransactionPayloadMultiSig).multiSig.transaction_payload?.transaction_payload;
    expect(inner).toBeInstanceOf(Script);
  });

  test("BCS round-trip for multisig script payload", async () => {
    const bytecode = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const multisigAddress = AccountAddress.TWO;
    const result = await generateTransactionPayload({ bytecode, functionArguments: [], multisigAddress });
    const bytes = result.bcsToBytes();
    const restored = TransactionPayloadMultiSig.load(new Deserializer(bytes.slice(1)));
    expect(restored.multiSig.transaction_payload?.transaction_payload).toBeInstanceOf(Script);
    const script = restored.multiSig.transaction_payload?.transaction_payload as Script;
    expect(script.bytecode).toEqual(bytecode);
  });
});
