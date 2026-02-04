/**
 * This file runs in the browser and exposes SDK functionality for Playwright tests
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  NetworkToNetworkName,
  Ed25519PrivateKey,
  Hex,
  AccountAddress,
  InputViewFunctionJsonData,
} from "@aptos-labs/ts-sdk";

// Get network from URL params or default to devnet
const urlParams = new URLSearchParams(window.location.search);
const networkParam = urlParams.get("network") || "devnet";
const APTOS_NETWORK: Network = NetworkToNetworkName[networkParam] || Network.DEVNET;

// Create the Aptos client
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Expose SDK functions to window for Playwright tests
declare global {
  interface Window {
    aptosSDK: {
      aptos: Aptos;
      generateAccount: () => {
        address: string;
        publicKey: string;
        privateKey: string;
      };
      createAccountFromPrivateKey: (privateKeyHex: string) => string;
      parseAddress: (address: string) => { short: string; long: string };
      parseHex: (hex: string) => string;
      getLedgerInfo: () => Promise<{ chainId: number; epoch: string; ledgerVersion: string }>;
      getChainId: () => Promise<number>;
      fundAccount: (address: string, amount: number) => Promise<string>;
      getBalance: (address: string) => Promise<number>;
      transfer: (
        fromPrivateKey: string,
        toAddress: string,
        amount: number,
      ) => Promise<{ hash: string; success: boolean }>;
      sponsoredTransfer: (
        senderPrivateKey: string,
        sponsorPrivateKey: string,
        toAddress: string,
        amount: number,
      ) => Promise<{ hash: string; success: boolean }>;
    };
  }
}

window.aptosSDK = {
  aptos,

  generateAccount: () => {
    const account = Account.generate();
    return {
      address: account.accountAddress.toString(),
      publicKey: account.publicKey.toString(),
      privateKey: account.privateKey.toString(),
    };
  },

  createAccountFromPrivateKey: (privateKeyHex: string) => {
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    const account = Account.fromPrivateKey({ privateKey });
    return account.accountAddress.toString();
  },

  parseAddress: (address: string) => {
    const addr = AccountAddress.fromString(address);
    return {
      short: addr.toString(),
      long: addr.toStringLong(),
    };
  },

  parseHex: (hex: string) => {
    const h = Hex.fromHexString(hex);
    return h.toString();
  },

  getLedgerInfo: async () => {
    const info = await aptos.getLedgerInfo();
    return {
      chainId: info.chain_id,
      epoch: info.epoch,
      ledgerVersion: info.ledger_version,
    };
  },

  getChainId: async () => {
    return await aptos.getChainId();
  },

  fundAccount: async (address: string, amount: number) => {
    const txn = await aptos.fundAccount({
      accountAddress: AccountAddress.fromString(address),
      amount,
    });
    return txn.hash;
  },

  getBalance: async (address: string) => {
    const payload: InputViewFunctionJsonData = {
      function: "0x1::coin::balance",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [address],
    };
    const [balance] = await aptos.viewJson<[number]>({ payload });
    return Number(balance);
  },

  transfer: async (fromPrivateKey: string, toAddress: string, amount: number) => {
    const privateKey = new Ed25519PrivateKey(fromPrivateKey);
    const sender = Account.fromPrivateKey({ privateKey });

    const txn = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [AccountAddress.fromString(toAddress), amount],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: sender,
      transaction: txn,
    });

    const result = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    return {
      hash: committedTxn.hash,
      success: result.success,
    };
  },

  sponsoredTransfer: async (senderPrivateKey: string, sponsorPrivateKey: string, toAddress: string, amount: number) => {
    const senderKey = new Ed25519PrivateKey(senderPrivateKey);
    const sender = Account.fromPrivateKey({ privateKey: senderKey });

    const sponsorKey = new Ed25519PrivateKey(sponsorPrivateKey);
    const sponsor = Account.fromPrivateKey({ privateKey: sponsorKey });

    const transaction = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      withFeePayer: true,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [AccountAddress.fromString(toAddress), amount],
      },
    });

    const senderAuthenticator = aptos.transaction.sign({ signer: sender, transaction });
    const sponsorAuthenticator = aptos.transaction.signAsFeePayer({ signer: sponsor, transaction });

    const committedTxn = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
      feePayerAuthenticator: sponsorAuthenticator,
    });

    const result = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    return {
      hash: committedTxn.hash,
      success: result.success,
    };
  },
};

// Signal that SDK is loaded
document.getElementById("results")!.textContent = "SDK loaded successfully!";
console.log("Aptos SDK loaded and exposed to window.aptosSDK");
