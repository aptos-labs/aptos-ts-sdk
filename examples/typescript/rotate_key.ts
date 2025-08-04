/* eslint-disable no-console */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519Account,
  MultiKey,
  Network,
  NetworkToNetworkName,
  TransactionManager,
} from "@aptos-labs/ts-sdk";

const WIDTH = 16;

// Set up the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.LOCAL];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);
const txnManager = TransactionManager.new(aptos);

function truncate(address: AccountAddress): string {
  return `${address.toString().substring(0, 6)}...${address
    .toString()
    .substring(address.toString().length - 4, address.toString().length)}`;
}

function formatAccountInfo(account: Ed25519Account): string {
  const vals: any[] = [account.accountAddress, account.publicKey.authKey(), account.privateKey, account.publicKey];
  return vals.map((v) => truncate(v).padEnd(WIDTH)).join(" ");
}

(async () => {
  const alice = Account.generate();
  const bob = Account.generate();

  await txnManager.fundAccount(alice).submit();
  await txnManager.fundAccount(bob).submit();

  console.log(
    `\n${"Account".padEnd(WIDTH)} ${"Address".padEnd(WIDTH)} ${"Auth Key".padEnd(WIDTH)} ${"Private Key".padEnd(
      WIDTH,
    )} ${"Public Key".padEnd(WIDTH)}`,
  );
  console.log("---------------------------------------------------------------------------------");
  console.log(`${"alice".padEnd(WIDTH)} ${formatAccountInfo(alice)}`);
  console.log(`${"bob".padEnd(WIDTH)} ${formatAccountInfo(bob)}`);
  console.log("\n...rotating...".padStart(WIDTH));

  txnManager.defaultSender(alice);

  // Rotate the key!
  await txnManager.rotateAuthKeyUnverified({ toNewPublicKey: new MultiKey({
      publicKeys: [bob.publicKey, alice.publicKey],
      signaturesRequired: 1,
    }),
  }).submit();

  // Transaction manager will derive the correct public key.
  await txnManager.transferCoinTransaction({ recipient: bob.accountAddress, amount: 10 }).submit();
})();
