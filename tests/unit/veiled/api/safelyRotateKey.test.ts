import { TwistedEd25519PrivateKey, VeiledCoin } from "../../../../src";
import {
  addNewContentLineToFile,
  aptos,
  getBalances,
  getTestAccount,
  getTestVeiledAccount,
  TOKEN_ADDRESS,
} from "../helpers";
import { preloadTables } from "../kangaroo/wasmPollardKangaroo";

describe("Safely rotate Alice's veiled balance key", () => {
  const alice = getTestAccount();
  const aliceVeiled = getTestVeiledAccount(alice);

  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

  const ALICE_NEW_VEILED_PRIVATE_KEY = TwistedEd25519PrivateKey.generate();
  test("it should safely rotate Alice's veiled balance key", async () => {
    const balances = await getBalances(aliceVeiled, alice.accountAddress);

    const keyRotationAndUnfreezeTxResponse = await VeiledCoin.safeRotateVBKey(aptos, alice, {
      sender: alice.accountAddress,

      currDecryptionKey: aliceVeiled,
      newDecryptionKey: ALICE_NEW_VEILED_PRIVATE_KEY,

      currEncryptedBalance: balances.actual.amountEncrypted!,

      withUnfreezeBalance: true,
      tokenAddress: TOKEN_ADDRESS,
    });

    console.log("gas used:", keyRotationAndUnfreezeTxResponse.gas_used);

    /* eslint-disable no-console */
    console.log("\n\n\n");
    console.log("SAVE NEW ALICE'S VEILED PRIVATE KEY");
    console.log(ALICE_NEW_VEILED_PRIVATE_KEY.toString());
    console.log("\n\n\n");
    /* eslint-enable */

    addNewContentLineToFile(".env.development", ALICE_NEW_VEILED_PRIVATE_KEY.toString());

    expect(keyRotationAndUnfreezeTxResponse.success).toBeTruthy();
  });
});
