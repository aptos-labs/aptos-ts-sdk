/* eslint-disable no-console */

import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const FUND_AMOUNT = 1_000_000_000;

// These keys are public and deterministic for this example. Never use them to hold real funds.
const INITIAL_ED25519_PRIVATE_KEY = new Ed25519PrivateKey(
  "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
);
const MULTI_ED25519_PRIVATE_KEYS = [
  new Ed25519PrivateKey("0x101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f"),
  new Ed25519PrivateKey("0x202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f"),
  new Ed25519PrivateKey("0x303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f"),
];
const FINAL_ED25519_PRIVATE_KEY = new Ed25519PrivateKey(
  "0x505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f",
);

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const aptos = new Aptos(new AptosConfig({ network: APTOS_NETWORK }));

const initialEd25519Account = Account.fromPrivateKey({ privateKey: INITIAL_ED25519_PRIVATE_KEY });
const multiEd25519Account = new MultiEd25519Account({
  publicKey: new MultiEd25519PublicKey({
    publicKeys: MULTI_ED25519_PRIVATE_KEYS.map((privateKey) => privateKey.publicKey()),
    threshold: 2,
  }),
  signers: MULTI_ED25519_PRIVATE_KEYS.slice(0, 2),
  address: initialEd25519Account.accountAddress,
});
const finalEd25519Account = Account.fromPrivateKey({
  privateKey: FINAL_ED25519_PRIVATE_KEY,
  address: initialEd25519Account.accountAddress,
});

type NamedSigner = {
  account: Ed25519Account | MultiEd25519Account;
  name: string;
};

const knownSigners: NamedSigner[] = [
  { account: initialEd25519Account, name: "initial Ed25519" },
  { account: multiEd25519Account, name: "2-of-3 MultiEd25519" },
  { account: finalEd25519Account, name: "final Ed25519" },
];

async function getCurrentSigner(): Promise<NamedSigner> {
  const accountInfo = await aptos.getAccountInfo({ accountAddress: initialEd25519Account.accountAddress });
  const currentSigner = knownSigners.find(
    ({ account }) => account.publicKey.authKey().toString() === accountInfo.authentication_key,
  );
  if (!currentSigner) {
    throw new Error(
      `The account uses authentication key ${accountInfo.authentication_key}, which is not part of this example.`,
    );
  }
  return currentSigner;
}

async function rotateAndVerify(
  fromAccount: Account,
  toAccount: Ed25519Account | MultiEd25519Account,
  description: string,
): Promise<void> {
  const transaction = await aptos.rotateAuthKey({ fromAccount, toAccount });
  const pendingTransaction = await aptos.signAndSubmitTransaction({ signer: fromAccount, transaction });
  const committedTransaction = await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });

  const accountInfo = await aptos.getAccountInfo({ accountAddress: fromAccount.accountAddress });
  const expectedAuthenticationKey = toAccount.publicKey.authKey().toString();
  if (accountInfo.authentication_key !== expectedAuthenticationKey) {
    throw new Error(
      `Authentication key mismatch after ${description}: expected ${expectedAuthenticationKey}, received ${accountInfo.authentication_key}`,
    );
  }

  console.log(`${description} transaction: ${committedTransaction.hash}`);
  console.log(`Authentication key: ${expectedAuthenticationKey}`);
}

const example = async () => {
  await aptos.fundAccount({ accountAddress: initialEd25519Account.accountAddress, amount: FUND_AMOUNT });
  console.log(`Account address: ${initialEd25519Account.accountAddress}`);

  const currentSigner = await getCurrentSigner();
  if (currentSigner.account !== initialEd25519Account) {
    console.log(`Resetting ${currentSigner.name} to the initial Ed25519 signer...`);
    await rotateAndVerify(currentSigner.account, initialEd25519Account, "Preflight reset");
  }

  console.log("\nRotating to a 2-of-3 MultiEd25519 signer...");
  await rotateAndVerify(initialEd25519Account, multiEd25519Account, "Ed25519 to MultiEd25519 rotation");

  console.log("\nRotating to the fixed Ed25519 signer...");
  await rotateAndVerify(multiEd25519Account, finalEd25519Account, "MultiEd25519 to Ed25519 rotation");

  console.log("\nKey rotation example completed successfully.");
};

example();
