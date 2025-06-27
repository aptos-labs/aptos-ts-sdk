import {
  confidentialAsset,
  getTestAccount,
  getTestConfidentialAccount,
  longTestTimeout,
  TOKEN_ADDRESS,
} from "../../helpers";

describe("Register", () => {
  const alice = getTestAccount();
  const aliceConfidential = getTestConfidentialAccount(alice);

  console.log(alice.accountAddress.toString())

  it(
    "it should register Alice confidential balance",
    async () => {
      const tx = await confidentialAsset.registerBalance({
        decryptionKey: aliceConfidential,
        tokenAddress: TOKEN_ADDRESS,
        signer: alice,
      });

      console.log("gas used:", tx.gas_used);

      expect(tx.success).toBeTruthy();
    },
    longTestTimeout,
  );
});
