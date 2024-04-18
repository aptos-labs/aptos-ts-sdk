import { Account, U8, MoveVector, U64, AccountAddress } from "../../../src";
import { ProofChallenge } from "../../../src/transactions/instances/proofChallenge";
import { getAptosClient } from "../helper";

const { aptos } = getAptosClient();

describe("proof challenge", () => {
  test("it creates generic challenge with simple arguments", async () => {
    const fromAccount = Account.generate();
    const newAccount = Account.generate();

    await aptos.fundAccount({ accountAddress: fromAccount.accountAddress, amount: 1_000_000_000 });

    const accountInfo = await aptos.getAccountInfo({
      accountAddress: fromAccount.accountAddress,
    });

    const challenge = await aptos.createProofChallenge({
      struct: "0x1::account::RotationProofChallenge",
      data: [
        BigInt(accountInfo.sequence_number),
        fromAccount.accountAddress,
        accountInfo.authentication_key,
        newAccount.publicKey.toUint8Array(),
      ],
    });

    expect(challenge instanceof ProofChallenge).toBeTruthy();
  });

  test("it creates generic challenge with BCS arguments", async () => {
    const fromAccount = Account.generate();
    const newAccount = Account.generate();

    await aptos.fundAccount({ accountAddress: fromAccount.accountAddress, amount: 1_000_000_000 });

    const accountInfo = await aptos.getAccountInfo({
      accountAddress: fromAccount.accountAddress,
    });

    const challenge = await aptos.createProofChallenge({
      struct: "0x1::account::RotationProofChallenge",
      data: [
        new U64(BigInt(accountInfo.sequence_number)),
        AccountAddress.from(fromAccount.accountAddress),
        AccountAddress.from(accountInfo.authentication_key),
        MoveVector.U8(newAccount.publicKey.toUint8Array()),
      ],
    });

    expect(challenge instanceof ProofChallenge).toBeTruthy();
  });

  test("gets generic challenge", async () => {
    const fromAccount = Account.generate();
    const newAccount = Account.generate();

    await aptos.fundAccount({ accountAddress: fromAccount.accountAddress, amount: 1_000_000_000 });
    await aptos.fundAccount({ accountAddress: newAccount.accountAddress, amount: 1_000_000_000 });

    const accountInfo = await aptos.getAccountInfo({
      accountAddress: fromAccount.accountAddress,
    });

    const challenge = await aptos.createProofChallenge({
      struct: "0x1::account::RotationProofChallenge",
      data: [
        new U64(BigInt(accountInfo.sequence_number)),
        AccountAddress.from(fromAccount.accountAddress),
        AccountAddress.from(accountInfo.authentication_key),
        MoveVector.U8(newAccount.publicKey.toUint8Array()),
      ],
    });

    const deserializedChallenge = await aptos.getProofChallenge({
      struct: "0x1::account::RotationProofChallenge",
      data: challenge.bcsToBytes(),
    });

    expect(deserializedChallenge.structName).toEqual("0x1::account::RotationProofChallenge");
    expect(deserializedChallenge.functionArguments[0]).toEqual(0n);
    expect(deserializedChallenge.functionArguments[1]).toEqual(fromAccount.accountAddress.toString());
    // account authentication_key is the account address
    expect(deserializedChallenge.functionArguments[2]).toEqual(fromAccount.accountAddress.toString());
    expect(deserializedChallenge.functionArguments[3]).toEqual(newAccount.publicKey.toString());
  });

  test("it submits generic challenge transaction", async () => {
    const fromAccount = Account.generate();
    const newAccount = Account.generate();

    await aptos.fundAccount({ accountAddress: fromAccount.accountAddress, amount: 1_000_000_000 });
    await aptos.fundAccount({ accountAddress: newAccount.accountAddress, amount: 1_000_000_000 });

    const accountInfo = await aptos.getAccountInfo({
      accountAddress: fromAccount.accountAddress,
    });

    const challenge = await aptos.createProofChallenge({
      struct: "0x1::account::RotationProofChallenge",
      data: [
        BigInt(accountInfo.sequence_number),
        fromAccount.accountAddress,
        accountInfo.authentication_key,
        newAccount.publicKey.toUint8Array(),
      ],
    });

    const proofSignedByCurrentPrivateKey = aptos.signProofChallenge({ challenge, signer: fromAccount });
    const proofSignedByNewPrivateKey = aptos.signProofChallenge({ challenge, signer: newAccount });

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
    const executedTransaction = await aptos.waitForTransaction({ transactionHash: response.hash });
    expect(executedTransaction.success).toBeTruthy();
  });
});
