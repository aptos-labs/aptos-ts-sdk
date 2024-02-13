/* eslint-disable no-console */

import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519Signer,
  Network,
  NetworkToNetworkName,
  Signer,
} from "@aptos-labs/ts-sdk";

const WIDTH = 16;

// Setup the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK] || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

function truncate(address: AccountAddress): string {
  return `${address.toString().substring(0, 6)}...${address
    .toString()
    .substring(address.toString().length - 4, address.toString().length)}`;
}

function formatSignerInfo(signer: Ed25519Signer): string {
  const vals: any[] = [signer.accountAddress, signer.publicKey.authKey(), signer.privateKey, signer.publicKey];
  return vals.map((v) => truncate(v).padEnd(WIDTH)).join(" ");
}

(async () => {
  const alice = Signer.generate();
  const bob = Signer.generate();

  await aptos.fundAccount({ accountAddress: alice.accountAddress, amount: 1000000000 });
  await aptos.fundAccount({ accountAddress: bob.accountAddress, amount: 1000000000 });

  console.log(
    `\n${"Account".padEnd(WIDTH)} ${"Address".padEnd(WIDTH)} ${"Auth Key".padEnd(WIDTH)} ${"Private Key".padEnd(
      WIDTH,
    )} ${"Public Key".padEnd(WIDTH)}`,
  );
  console.log("---------------------------------------------------------------------------------");
  console.log(`${"alice".padEnd(WIDTH)} ${formatSignerInfo(alice)}`);
  console.log(`${"bob".padEnd(WIDTH)} ${formatSignerInfo(bob)}`);
  console.log("\n...rotating...".padStart(WIDTH));

  // Rotate the key!
  await aptos.rotateAuthKey({ fromSigner: alice, toSigner: bob });

  const aliceNew = Signer.fromPrivateKey({ privateKey: bob.privateKey, address: alice.accountAddress });

  console.log(`\n${"alice".padEnd(WIDTH)} ${formatSignerInfo(aliceNew)}`);
  console.log(`${"bob".padEnd(WIDTH)} ${formatSignerInfo(bob)}\n`);
})();
