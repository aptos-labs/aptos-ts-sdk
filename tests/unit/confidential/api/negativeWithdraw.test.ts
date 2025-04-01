import {
  aptos,
  getBalances,
  getTestConfidentialAccount,
  sendAndWaitTx,
} from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";
import { longTestTimeout } from "../../helper";
import { Account, AccountAddress, TwistedEd25519PublicKey, TwistedEd25519PrivateKey } from "../../../../src";
import { numberToBytesLE, bytesToNumberLE } from "@noble/curves/abstract/utils";
import { bytesToHex } from "@noble/hashes/utils";
import { ed25519modN } from "../../../../src/core/crypto/utils";

describe("Transfer", () => {
  const alice = Account.generate();
//   const aliceConfidential = getTestConfidentialAccount(alice);
  const aliceConfidential = new TwistedEd25519PrivateKey("b761042f60932886fe0bb8677349ab9afc9bae40fdd108666a446d8434d1780b");

  const coinType = "0x1::aptos_coin::AptosCoin";
  const tokenAddress = '0x000000000000000000000000000000000000000000000000000000000000000a';
  const fundAmount = 1 * 10**8;
  const depositAmount = 0.5 * 10**8;
  const recipientAccAddr = "0x82094619a5e8621f2bf9e6479a62ed694dca9b8fd69b0383fce359a3070aa0d4";
  const withdrawAmount = BigInt(0.1 * 10**8);

  console.log("pk", alice.privateKey.toString())
  console.log("dk", aliceConfidential.toString())
  console.log("ek", aliceConfidential.publicKey().toString())
  console.log("dk(move)", bytesToHex(numberToBytesLE(ed25519modN(bytesToNumberLE(aliceConfidential.toUint8Array())), 32)))

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
    })
  })

  it("should register Alice's balance", async () => {
    const aliceRegisterVBTxBody = await aptos.confidentialCoin.registerBalance({
        sender: alice.accountAddress,
        tokenAddress: tokenAddress,
        publicKey: aliceConfidential.publicKey(),
    });

    const aliceTxResp = await sendAndWaitTx(aliceRegisterVBTxBody, alice);

    console.log("gas used:", aliceTxResp.gas_used);
  })

  it.skip("should deposit money to Alice's account", async () => {
    const depositTx = await aptos.confidentialCoin.depositCoin({
        sender: alice.accountAddress,
        coinType,
        amount: depositAmount,
    });

    const resp = await sendAndWaitTx(depositTx, alice);

    console.log("gas used:", resp.gas_used);
  })

  it("should transfer money from Alice actual to pending balance", async () => {
    const balances = await getBalances(aliceConfidential, alice.accountAddress, tokenAddress);

    const recipientEncKey = await aptos.confidentialCoin.getEncryptionByAddr({
      accountAddress: AccountAddress.from(recipientAccAddr),
      tokenAddress,
    });

    console.log({ recipientEncKey: recipientEncKey.toString() })

    const withdrawTx = await aptos.confidentialCoin.withdraw({
        sender: alice.accountAddress,
        tokenAddress,
        decryptionKey: aliceConfidential,
        encryptedActualBalance: balances.actual.amountEncrypted!,
        amountToWithdraw: withdrawAmount,
    });

    const txResp = await sendAndWaitTx(withdrawTx, alice);

    console.log("gas used:", txResp.gas_used);

    const balancesAfterTransfer = await getBalances(aliceConfidential, alice.accountAddress, tokenAddress);

    console.log(balancesAfterTransfer.actual)

    expect(txResp.success).toBeTruthy();
  });
});
