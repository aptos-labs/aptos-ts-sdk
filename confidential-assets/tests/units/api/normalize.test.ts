import {
  confidentialAsset,
  getBalances,
  getTestAccount,
  getTestConfidentialAccount,
  longTestTimeout,
  sendAndWaitTx,
  TOKEN_ADDRESS,
} from "../../helpers";
import { preloadTables } from "../../helpers/wasmPollardKangaroo";

describe("Normalize", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  it(
    "it should normalize Alice's confidential balance",
    async () => {
      const balances = await getBalances(aliceConfidential, alice.accountAddress);

      const normalizeTx = await confidentialAsset.normalizeUserBalance({
        tokenAddress: TOKEN_ADDRESS,
        decryptionKey: aliceConfidential,
        unnormalizedEncryptedBalance: balances.actual.getAmountEncrypted(aliceConfidential.publicKey()),
        balanceAmount: balances.actual.amount,

        sender: alice.accountAddress,
      });

      const txResp = await sendAndWaitTx(normalizeTx, alice);

      console.log("gas used:", txResp.gas_used);

      expect(txResp.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
