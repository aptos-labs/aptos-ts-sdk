/**
 * v10 Deno runtime test — account generation, funding, transfer
 * Uses v10 native API (no compat layer).
 */

import { Aptos, Network, generateAccount, AccountAddress, U64 } from "@aptos-labs/ts-sdk";
import type { Ed25519Account } from "@aptos-labs/ts-sdk";

const ALICE_INITIAL_BALANCE = 100_000_000;
const TRANSFER_AMOUNT = 1_000;

const APTOS_NETWORK: Network = (Deno.env.get("APTOS_NETWORK") as Network) || Network.LOCAL;

const example = async () => {
  console.log("v10 Deno Runtime Test: account generation, funding, and transfer");
  console.log(`Deno version: ${Deno.version.deno}, network: ${APTOS_NETWORK}`);

  const aptos = new Aptos({ network: APTOS_NETWORK });

  // Generate accounts
  const alice = generateAccount() as Ed25519Account;
  const bob = generateAccount() as Ed25519Account;
  console.log(`Alice: ${alice.accountAddress}`);
  console.log(`Bob:   ${bob.accountAddress}`);

  // Fund Alice
  console.log("\n=== Funding Alice ===");
  const fundTxn = await aptos.faucet.fund(alice.accountAddress, ALICE_INITIAL_BALANCE);
  console.log(`Fund tx: ${fundTxn.hash} (success: ${fundTxn.success})`);

  // Check balance via view function
  const [balanceBefore] = await aptos.general.view<[string]>({
    function: "0x1::coin::balance",
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: [alice.accountAddress.toString()],
  });
  console.log(`Alice balance: ${balanceBefore}`);
  if (Number(balanceBefore) !== ALICE_INITIAL_BALANCE) {
    throw new Error(`Expected ${ALICE_INITIAL_BALANCE}, got ${balanceBefore}`);
  }

  // Transfer Alice → Bob
  console.log("\n=== Transfer ===");
  const tx = await aptos.transaction.buildSimple(alice.accountAddress, {
    function: "0x1::aptos_account::transfer",
    typeArguments: [],
    functionArguments: [AccountAddress.from(bob.accountAddress), new U64(TRANSFER_AMOUNT)],
  });

  const pending = await aptos.transaction.signAndSubmit(alice, tx);
  const committed = await aptos.transaction.waitForTransaction(pending.hash, { checkSuccess: true });
  console.log(`Transfer tx: ${committed.hash} (success: ${"success" in committed && committed.success})`);

  // Verify Bob received funds
  const bobInfo = await aptos.account.getInfo(bob.accountAddress);
  console.log(`Bob account exists: sequence_number=${bobInfo.sequence_number}`);

  console.log("\n=== v10 Deno Runtime Test Passed! ===");
};

await example();
