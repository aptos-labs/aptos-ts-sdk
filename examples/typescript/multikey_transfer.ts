/* eslint-disable no-console */

/**
 * This example demonstrates how to use MultiKey accounts to send transactions.
 *
 * A MultiKey account is a K-of-N multi-signer account that supports mixed key types
 * (Ed25519, Secp256k1, etc.). The account address is derived from all N public keys
 * and the required signature threshold K. Any K of the N signers can authorize a transaction.
 *
 * This example creates a 2-of-3 MultiKey account using:
 *  - One Ed25519 signer (single key variant)
 *  - One Secp256k1 signer
 *  - One additional Ed25519 public key (not used for signing, but part of the key set)
 */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  InputViewFunctionJsonData,
  MultiKey,
  MultiKeyAccount,
  Network,
  NetworkToNetworkName,
  SigningSchemeInput,
} from "@aptos-labs/ts-sdk";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const MULTIKEY_INITIAL_BALANCE = 1_000_000_000;
const RECEIVER_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 100;

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

const balance = async (aptos: Aptos, name: string, address: AccountAddress): Promise<number> => {
  const payload: InputViewFunctionJsonData = {
    function: "0x1::coin::balance",
    typeArguments: [APTOS_COIN],
    functionArguments: [address.toString()],
  };
  const [amount] = await aptos.viewJson<[number]>({ payload });
  console.log(`${name}'s balance is: ${amount}`);
  return Number(amount);
};

const example = async () => {
  console.log(
    "This example will create a 2-of-3 MultiKey account with mixed key types, fund it, and transfer from it.",
  );

  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  // Generate individual signers with different key types
  const signer1 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });
  const signer2 = Account.generate({ scheme: SigningSchemeInput.Secp256k1Ecdsa });
  // A third key that is part of the MultiKey but won't be used for signing
  const signer3 = Account.generate({ scheme: SigningSchemeInput.Ed25519, legacy: false });

  console.log("\n=== Individual Signer Addresses ===\n");
  console.log(`Signer 1 (Ed25519):   ${signer1.accountAddress}`);
  console.log(`Signer 2 (Secp256k1): ${signer2.accountAddress}`);
  console.log(`Signer 3 (Ed25519):   ${signer3.accountAddress}`);

  // Create a 2-of-3 MultiKey: any 2 of these 3 signers can authorize a transaction
  const multiKey = new MultiKey({
    publicKeys: [signer1.publicKey, signer2.publicKey, signer3.publicKey],
    signaturesRequired: 2,
  });

  // Create the MultiKeyAccount with the two signers that will actually sign.
  // The SDK automatically figures out which keys in the MultiKey each signer corresponds to.
  const multiKeyAccount = new MultiKeyAccount({
    multiKey,
    signers: [signer1, signer2],
  });

  console.log(`\nMultiKey account address: ${multiKeyAccount.accountAddress}`);
  console.log(`Signing scheme: ${multiKeyAccount.signingScheme}`);

  // Create a receiver
  const receiver = Account.generate();
  console.log(`Receiver address: ${receiver.accountAddress}`);

  // Fund accounts
  console.log("\n=== Funding accounts ===\n");
  await aptos.fundAccount({ accountAddress: multiKeyAccount.accountAddress, amount: MULTIKEY_INITIAL_BALANCE });
  console.log(`Funded MultiKey account with ${MULTIKEY_INITIAL_BALANCE}`);

  await aptos.fundAccount({ accountAddress: receiver.accountAddress, amount: RECEIVER_INITIAL_BALANCE });
  console.log(`Funded Receiver account with ${RECEIVER_INITIAL_BALANCE}`);

  // Show initial balances
  console.log("\n=== Initial Balances ===\n");
  const multiKeyBalance = await balance(aptos, "MultiKey", multiKeyAccount.accountAddress);
  const receiverBalance = await balance(aptos, "Receiver", receiver.accountAddress);

  if (multiKeyBalance !== MULTIKEY_INITIAL_BALANCE) throw new Error("MultiKey balance is incorrect");
  if (receiverBalance !== RECEIVER_INITIAL_BALANCE) throw new Error("Receiver balance is incorrect");

  // Build a transfer transaction from the MultiKey account
  const transaction = await aptos.transaction.build.simple({
    sender: multiKeyAccount.accountAddress,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: [APTOS_COIN],
      functionArguments: [receiver.accountAddress, TRANSFER_AMOUNT],
    },
  });

  // Sign the transaction — both signers (signer1 and signer2) sign under the hood
  console.log("\n=== Signing and Submitting Transaction ===\n");
  const senderAuthenticator = aptos.transaction.sign({ signer: multiKeyAccount, transaction });

  const response = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });
  console.log(`Submitted transaction: ${response.hash}`);

  await aptos.waitForTransaction({ transactionHash: response.hash });
  console.log("Transaction confirmed!");

  // Show final balances
  console.log("\n=== Balances After Transfer ===\n");
  const newMultiKeyBalance = await balance(aptos, "MultiKey", multiKeyAccount.accountAddress);
  const newReceiverBalance = await balance(aptos, "Receiver", receiver.accountAddress);

  if (newReceiverBalance !== TRANSFER_AMOUNT + RECEIVER_INITIAL_BALANCE) {
    throw new Error("Receiver balance after transfer is incorrect");
  }
  if (newMultiKeyBalance >= MULTIKEY_INITIAL_BALANCE - TRANSFER_AMOUNT) {
    throw new Error("MultiKey balance after transfer is incorrect");
  }

  console.log("\nMultiKey transfer example completed successfully!");
};

example();
