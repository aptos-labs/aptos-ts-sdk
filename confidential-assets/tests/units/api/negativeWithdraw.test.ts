import { AccountAddress } from "@aptos-labs/ts-sdk";
import {
  aptos,
  confidentialAsset,
  getBalances,
  getTestAccount,
  getTestConfidentialAccount,
  longTestTimeout,
  sendAndWaitTx,
} from "../../helpers";
import { numberToBytesLE, bytesToNumberLE } from "@noble/curves/abstract/utils";
import { bytesToHex } from "@noble/hashes/utils";
import { ed25519modN } from "../../../src";
import { preloadTables } from "../../helpers/wasmPollardKangaroo";

describe("Negative withdraw", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  const coinType = "0x1::aptos_coin::AptosCoin";
  const tokenAddress = "0x000000000000000000000000000000000000000000000000000000000000000a";
  const fundAmount = 1 * 10 ** 8;
  const depositAmount = 0.5 * 10 ** 8;
  const recipientAccAddr = "0x82094619a5e8621f2bf9e6479a62ed694dca9b8fd69b0383fce359a3070aa0d4";
  const withdrawAmount = BigInt(0.1 * 10 ** 8);

  console.log("pk", alice.privateKey.toString());
  console.log("dk", aliceConfidential.toString());
  console.log("ek", aliceConfidential.publicKey().toString());
  console.log(
    "dk(move)",
    bytesToHex(numberToBytesLE(ed25519modN(bytesToNumberLE(aliceConfidential.toUint8Array())), 32)),
  );

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it("should fund Alice's account", async () => {
    await aptos.fundAccount({
      accountAddress: alice.accountAddress,
      amount: fundAmount,
    });
  });

  it("should register Alice's balance", async () => {
    const aliceRegisterVBTxBody = await confidentialAsset.registerBalance({
      sender: alice.accountAddress,
      tokenAddress: tokenAddress,
      publicKey: aliceConfidential.publicKey(),
    });

    const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

    console.log("gas used:", aliceTxResp.gas_used);
  });

  it("should deposit money to Alice's account", async () => {
    const depositTx = await confidentialAsset.depositCoin({
      sender: alice.accountAddress,
      coinType,
      amount: depositAmount,
    });

    const resp = await sendAndWaitTx(depositTx, alice);

    console.log("gas used:", resp.gas_used);
  });

  it("should throw error withdrawing money from Alice actual balance", async () => {
    const balances = await getBalances(aliceConfidential, alice.accountAddress, tokenAddress);

    const recipientEncKey = await confidentialAsset.getEncryptionByAddr({
      accountAddress: AccountAddress.from(recipientAccAddr),
      tokenAddress,
    });

    console.log({ recipientEncKey: recipientEncKey.toString() });

    const withdrawTx = await confidentialAsset.withdraw({
      sender: alice.accountAddress,
      tokenAddress,
      decryptionKey: aliceConfidential,
      encryptedActualBalance: balances.actual.getAmountEncrypted(aliceConfidential.publicKey()),
      amountToWithdraw: withdrawAmount,
    });

    const txRespPromise = sendAndWaitTx(withdrawTx, alice);

    expect(txRespPromise).rejects.toThrow();
  });
});
