/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use the Keyless accounts on Aptos
 */

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  EphemeralKeyPair,
  MultiEd25519Account,
  MultiEd25519PublicKey,
  MultiKey,
  MultiKeyAccount,
  Network,
  Secp256k1PrivateKey,
} from "@aptos-labs/ts-sdk";


const example = async () => {
  // Set up the client
  const config = new AptosConfig({ network: Network.MAINNET });
  const aptos = new Aptos(config);

  const singleSignerEd25519Accounts = [];
  const ed25519Accounts = [];
  const secp256k1Accounts = [];

  for (let i = 90; i < 100; i += 1) {
    console.log(i);
    const pk = new Ed25519PrivateKey(
      `ed25519-priv-0x11111111111111111111111111111111111111111111111111111111111111${i}`,
    );
    ed25519Accounts.push(Account.fromPrivateKey({ privateKey: pk }));
    singleSignerEd25519Accounts.push(Account.fromPrivateKey({ privateKey: pk, legacy: false }));

    const pk2 = new Secp256k1PrivateKey(
      `secp256k1-priv-0x11111111111111111111111111111111111111111111111111111111111111${i}`,
    );
    secp256k1Accounts.push(Account.fromPrivateKey({ privateKey: pk2 }));
  }

  const multiKey = new MultiKey({
    publicKeys: [
      ed25519Accounts[0].publicKey,
      ed25519Accounts[1].publicKey,
      secp256k1Accounts[0].publicKey,
      secp256k1Accounts[1].publicKey,
    ],
    signaturesRequired: 2,
  });
  const multiKeyAccount = new MultiKeyAccount({
    multiKey,
    signers: [secp256k1Accounts[0], ed25519Accounts[0]],
  });

  const mainAccount = ed25519Accounts[0];
  await aptos.fundAccount({ accountAddress: mainAccount.accountAddress, amount: 100_000_000 });
  console.log("--------------------------------");
  console.log(mainAccount.accountAddress.toString());

  let account0 = ed25519Accounts[4];
  let account1 = ed25519Accounts[5];
  let account2 = ed25519Accounts[6];
  let account3 = secp256k1Accounts[5];
  let account4 = singleSignerEd25519Accounts[5];
  const mk = new MultiKey({
    publicKeys: [account1.publicKey, account2.publicKey, account3.publicKey],
    signaturesRequired: 2,
  });
  let account5 = new MultiKeyAccount({
    multiKey: mk,
    signers: [account1, account2],
  });
  let account5_1 = new MultiKeyAccount({
    multiKey: mk,
    signers: [account1, account3],
  });
  const mk2 = new MultiEd25519PublicKey({
    publicKeys: [account2.publicKey, account1.publicKey, account0.publicKey],
    threshold: 1,
  });
  let account6 = new MultiEd25519Account({
    publicKey: mk2,
    signers: [account2.privateKey],
  });

  const accounts = [account0, account1, account2, account3, account4, account5, account6];
  // fund all accounts
  for (const account of accounts) {
    let transaction = await aptos.transferCoinTransaction({
      sender: mainAccount.accountAddress,
      recipient: account.accountAddress,
      amount: 1_000_000,
    });
    let pendingTxn = await aptos.signAndSubmitTransaction({ signer: mainAccount, transaction });
    await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
  }

  const versions = [];
  async function makeTxn(account: Account, index: number, txnType: string) {
    let transaction = await aptos.transferCoinTransaction({
      sender: account.accountAddress,
      recipient: account.accountAddress,
      amount: 1,
    });
    let pendingTxn = await aptos.signAndSubmitTransaction({ signer: account, transaction });
    let res = await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
    versions.push(`${res.version}_acc${index}_${txnType}`);
  }
  // establish account
  for (const [index, account] of accounts.entries()) {
    await makeTxn(account, index, `signer_${index}`);
  }

  let pend = await aptos.rotateAuthKeyToMultiEd25519({
    fromAccount: account0,
    multiEd25519Account: account6,
  });
  let res = await aptos.waitForTransaction({ transactionHash: pend.hash });
  versions.push(`${res.version}_acc0_unverified_rotation_to_multi_ed25519_210_signer_2`);
  accounts[0] = new MultiEd25519Account({
    address: accounts[0].accountAddress,
    publicKey: account6.publicKey,
    signers: [account0.privateKey],
  });
  await makeTxn(accounts[0], 0, "multi_ed25519_210_signer_0");

  pend = await aptos.rotateAuthKeyUnverified({
    fromAccount: account1,
    toAccount: account6,
  });
  res = await aptos.waitForTransaction({ transactionHash: pend.hash });
  versions.push(`${res.version}_acc1_unverified_rotation_to_multi_ed25519_210`);
  accounts[1] = new MultiEd25519Account({
    address: accounts[1].accountAddress,
    publicKey: mk2,
    signers: [account0.privateKey],
  });

  await makeTxn(accounts[1], 1, "multi_ed25519_210_signer_0");

  accounts[1] = new MultiEd25519Account({
    address: accounts[1].accountAddress,
    publicKey: mk2,
    signers: [account1.privateKey],
  });
  await makeTxn(accounts[1], 1, "multi_ed25519_210_signer_1");

  pend = await aptos.rotateAuthKey({
    fromAccount: accounts[2],
    toNewPrivateKey: account0.privateKey,
  });
  res = await aptos.waitForTransaction({ transactionHash: pend.hash });
  versions.push(`${res.version}_acc2_unverified_rotation_to_ed25519_0`);
  accounts[2] = new Ed25519Account({
    address: accounts[2].accountAddress,
    privateKey: account0.privateKey,
  });
  await makeTxn(accounts[2], 2, "ed25519_signer_0");

  pend = await aptos.rotateAuthKeyUnverified({
    fromAccount: accounts[3],
    toAccount: account5,
  });
  res = await aptos.waitForTransaction({ transactionHash: pend.hash });
  versions.push(`${res.version}_acc3_unverified_rotation_to_multikey_123`);
  accounts[3] = new MultiKeyAccount({
    address: accounts[3].accountAddress,
    multiKey: mk,
    signers: [account1, account3],
  });
  await makeTxn(accounts[3], 3, "multikey_123_signer_13");
  accounts[3] = new MultiKeyAccount({
    address: accounts[3].accountAddress,
    multiKey: mk,
    signers: [account1, account2],
  });
  await makeTxn(accounts[3], 3, "multikey_123_signer_12");

  let txn = await aptos.transaction.build.simple({
    sender: account4.accountAddress,
    withFeePayer: true,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [account4.accountAddress, 1],
    },
  });
  const sponsorSignature = aptos.transaction.signAsFeePayer({ signer: account5, transaction: txn });

  // Submit the transaction to chain
  pend = await aptos.signAndSubmitTransaction({
    signer: account4,
    // TODO: This doesn't actually work here?
    feePayerAuthenticator: sponsorSignature,
    transaction: txn,
  });
  res = await aptos.waitForTransaction({ transactionHash: pend.hash });
  versions.push(`${res.version}_acc4_signer_anyKeyEd25519_4_fee_payer_acc5_multikey_123_signer_12`);

  for (const version of versions) {
    console.log(version);
  }
};

example();
