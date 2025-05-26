import {
  aptos,
  confidentialAsset,
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
      decryptionKey: aliceConfidential,
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
    const withdrawTx = await confidentialAsset.withdraw({
      sender: alice.accountAddress,
      tokenAddress,
      senderDecryptionKey: aliceConfidential,
      amount: withdrawAmount,
    });

    const txRespPromise = sendAndWaitTx(withdrawTx, alice);

    expect(txRespPromise).rejects.toThrow();
  });
});
