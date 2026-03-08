/**
 * v10 browser test — exposes SDK functionality to window for Playwright tests.
 * Uses v10 native API.
 */

import {
  Aptos,
  Network,
  generateAccount,
  accountFromPrivateKey,
  AccountAddress,
  Hex,
  Ed25519PrivateKey,
  U64,
} from "@aptos-labs/ts-sdk";
import type { Ed25519Account } from "@aptos-labs/ts-sdk";

// Get network from URL params
const urlParams = new URLSearchParams(window.location.search);
const networkParam = urlParams.get("network") || "devnet";
const APTOS_NETWORK = (networkParam as Network) || Network.DEVNET;

const aptos = new Aptos({ network: APTOS_NETWORK });

declare global {
  interface Window {
    aptosSDK: {
      generateAccount: () => { address: string; publicKey: string; privateKey: string };
      createAccountFromPrivateKey: (privateKeyHex: string) => string;
      parseAddress: (address: string) => { short: string; long: string };
      parseHex: (hex: string) => string;
      getLedgerInfo: () => Promise<{ chainId: number; epoch: string; ledgerVersion: string }>;
      getChainId: () => Promise<number>;
      fundAccount: (address: string, amount: number) => Promise<string>;
      getBalance: (address: string) => Promise<number>;
      transfer: (fromPrivateKey: string, toAddress: string, amount: number) => Promise<{ hash: string; success: boolean }>;
    };
  }
}

window.aptosSDK = {
  generateAccount: () => {
    const account = generateAccount() as Ed25519Account;
    return {
      address: account.accountAddress.toString(),
      publicKey: account.publicKey.toString(),
      privateKey: account.privateKey.toString(),
    };
  },

  createAccountFromPrivateKey: (privateKeyHex: string) => {
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = accountFromPrivateKey({ privateKey });
    return account.accountAddress.toString();
  },

  parseAddress: (address: string) => {
    const addr = AccountAddress.from(address);
    return {
      short: addr.toString(),
      long: addr.toStringLong(),
    };
  },

  parseHex: (hex: string) => {
    const h = Hex.fromHexInput(hex);
    return h.toString();
  },

  getLedgerInfo: async () => {
    const info = await aptos.general.getLedgerInfo();
    return {
      chainId: info.chain_id,
      epoch: info.epoch,
      ledgerVersion: info.ledger_version,
    };
  },

  getChainId: async () => {
    return await aptos.general.getChainId();
  },

  fundAccount: async (address: string, amount: number) => {
    const txn = await aptos.faucet.fund(AccountAddress.from(address), amount);
    return txn.hash;
  },

  getBalance: async (address: string) => {
    const [balance] = await aptos.general.view<[string]>({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    });
    return Number(balance);
  },

  transfer: async (fromPrivateKey: string, toAddress: string, amount: number) => {
    const privateKey = new Ed25519PrivateKey(fromPrivateKey);
    const sender = accountFromPrivateKey({ privateKey }) as Ed25519Account;

    const tx = await aptos.transaction.buildSimple(sender.accountAddress, {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [AccountAddress.from(toAddress), new U64(amount)],
    });

    const pending = await aptos.transaction.signAndSubmit(sender, tx);
    const result = await aptos.transaction.waitForTransaction(pending.hash, { checkSuccess: true });

    return {
      hash: pending.hash,
      success: "success" in result && result.success === true,
    };
  },
};

document.getElementById("results")!.textContent = "SDK loaded successfully!";
console.log("Aptos SDK v10 loaded and exposed to window.aptosSDK");
