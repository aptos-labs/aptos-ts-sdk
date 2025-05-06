import { longTestTimeout } from "../helpers";
import {
  confidentialAsset,
  getBalances,
  getTestAccount,
  getTestConfidentialAccount,
  sendAndWaitTx,
  MOCK_TOKEN_DATA,
} from "../helpers/e2e";
import { preloadTables } from "../helpers/wasmPollardKangaroo";

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
        tokenAddress: MOCK_TOKEN_DATA.address,
        decryptionKey: aliceConfidential,
        unnormalizedEncryptedBalance: balances.actual.amountEncrypted!,
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
