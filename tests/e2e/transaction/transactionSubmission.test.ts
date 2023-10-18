// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, AptosConfig, Network, Aptos, U64, SigningScheme } from "../../../src";
import { waitForTransaction } from "../../../src/internal/transaction";
import { FUND_AMOUNT, longTestTimeout } from "../../unit/helper";

describe("transaction submission", () => {
  describe("submitTransaction", () => {
    test(
      "it submits a script transaction",
      async () => {
        const config = new AptosConfig({ network: Network.LOCAL });
        const aptos = new Aptos(config);
        const alice = Account.generate();
        await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
        const bob = Account.generate();
        await aptos.fundAccount({ accountAddress: bob.accountAddress.toString(), amount: FUND_AMOUNT });
        const rawTxn = await aptos.generateTransaction({
          sender: alice.accountAddress.toString(),
          secondarySignerAddresses: [bob.accountAddress.toString()],
          data: {
            bytecode:
              // eslint-disable-next-line max-len
              "a11ceb0b060000000701000402040a030e18042608052e4307713e08af01200000000101020401000100030800010403040100010505060100010607040100010708060100000201020202030207060c060c0303050503030b000108010b000108010b0001080101080102060c03010b0001090002070b000109000b000109000002070b000109000302050b000109000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177056d657267650765787472616374076465706f73697400000000000000000000000000000000000000000000000000000000000000010000011a0b000a0238000c070b010a0338000c080d070b0838010d070b020b03160b061738020c090b040b0738030b050b09380302",
            arguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              bob.accountAddress,
              alice.accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });
        const authenticator = aptos.signTransaction({
          signer: alice,
          transaction: rawTxn,
        });
        const bobauthenticator = aptos.signTransaction({
          signer: bob,
          transaction: rawTxn,
        });
        const response = await aptos.submitTransaction({
          transaction: rawTxn,
          senderAuthenticator: authenticator,
          secondarySignerAuthenticators: {
            additionalSignersAuthenticators: [bobauthenticator],
          },
        });
        await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
      },
      longTestTimeout,
    );

    test("it submits an entry function transaction", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const alice = Account.generate();
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const rawTxn = await aptos.generateTransaction({
        sender: alice.accountAddress.toString(),
        data: {
          function: "0x1::aptos_account::transfer",
          arguments: [bob.accountAddress, new U64(1)],
        },
      });
      const authenticator = aptos.signTransaction({
        signer: alice,
        transaction: rawTxn,
      });
      const response = await aptos.submitTransaction({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
    });
    test.skip("it submits an entry function transaction with Secp256k1Ecdsa", async () => {
      const config = new AptosConfig({ network: Network.LOCAL });
      const aptos = new Aptos(config);
      const alice = Account.generate(SigningScheme.Secp256k1Ecdsa);
      await aptos.fundAccount({ accountAddress: alice.accountAddress.toString(), amount: FUND_AMOUNT });
      const bob = Account.generate();
      const rawTxn = await aptos.generateTransaction({
        sender: alice.accountAddress.toString(),
        data: {
          function: "0x1::aptos_account::transfer",
          arguments: [bob.accountAddress, new U64(1)],
        },
      });
      const authenticator = aptos.signTransaction({
        signer: alice,
        transaction: rawTxn,
      });
      const response = await aptos.submitTransaction({
        transaction: rawTxn,
        senderAuthenticator: authenticator,
      });
      await waitForTransaction({ aptosConfig: config, transactionHash: response.hash });
    });
  });
});
