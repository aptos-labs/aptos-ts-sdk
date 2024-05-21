/* eslint-disable no-console */
/* eslint-disable max-len */

import { Account, Aptos, AptosConfig, Network, NetworkToNetworkName, MoveVector, U8 } from "@aptos-labs/ts-sdk";

/**
 * This example demonstrate the end-to-end flow of creating, signing and submitting
 * a proog challenge to the Aptos chain
 */

// Setup the client
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.LOCAL];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

async function main() {
  // Create accounts
  const fromAccount = Account.generate();
  const newAccount = Account.generate();

  // Fund and create the accounts on chain
  await aptos.fundAccount({ accountAddress: fromAccount.accountAddress, amount: 1_000_000_000 });
  await aptos.fundAccount({ accountAddress: newAccount.accountAddress, amount: 1_000_000_000 });

  const accountInfo = await aptos.getAccountInfo({
    accountAddress: fromAccount.accountAddress,
  });

  // Create a rotation proof challenge.
  const challenge = await aptos.createProofChallenge({
    struct: "0x1::account::RotationProofChallenge",
    data: [
      BigInt(accountInfo.sequence_number),
      fromAccount.accountAddress,
      accountInfo.authentication_key,
      newAccount.publicKey.toUint8Array(),
    ],
  });

  // Display the challenge in a human readable format. This step is for
  // any service who needs/wants to show the challenge to the account before
  // they sign it.
  const deserializedChallenge = await aptos.getProofChallenge({
    struct: "0x1::account::RotationProofChallenge",
    data: challenge.bcsToBytes(),
  });

  console.log("rotation proof challenge to sign on", deserializedChallenge);

  // 1st account signs the challenge
  const proofSignedByCurrentPrivateKey = aptos.signProofChallenge({ challenge, signer: fromAccount });
  // 2nd account signs the challenge
  const proofSignedByNewPrivateKey = aptos.signProofChallenge({ challenge, signer: newAccount });

  // Submit challenge to chain
  const transaction = await aptos.transaction.build.simple({
    sender: fromAccount.accountAddress,
    data: {
      function: "0x1::account::rotate_authentication_key",
      functionArguments: [
        new U8(fromAccount.signingScheme), // from scheme
        MoveVector.U8(fromAccount.publicKey.toUint8Array()),
        new U8(newAccount.signingScheme), // to scheme
        MoveVector.U8(newAccount.publicKey.toUint8Array()),
        MoveVector.U8(proofSignedByCurrentPrivateKey.toUint8Array()),
        MoveVector.U8(proofSignedByNewPrivateKey.toUint8Array()),
      ],
    },
  });

  const response = await aptos.signAndSubmitTransaction({ signer: fromAccount, transaction });
  await aptos.waitForTransaction({ transactionHash: response.hash });
}

main();
