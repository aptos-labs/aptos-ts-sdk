import { Ed25519Account, Ed25519PrivateKey, SimpleTransaction } from "@aptos-labs/ts-sdk";
import { ConfidentialAmount, TwistedEd25519PrivateKey, TwistedElGamal, TwistedElGamalCiphertext } from "../../src";
import { aptos, confidentialAsset, FAUCET_TOKEN } from "../helpers";
import { createKangaroo } from "../helpers/wasmPollardKangaroo";
import { WASMKangaroo } from "@aptos-labs/confidential-asset-wasm-bindings/pollard-kangaroo";
import { bytesToNumberLE } from "@noble/curves/abstract/utils";

const usdtAddress = "0xd5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e38192050";

describe("Check balance", () => {
  it("should check balance with real account", async () => {
    if (!FAUCET_TOKEN) {
      console.warn("Skipping test because FAUCET_TOKEN is not set, we need it to fund the account on testnet");
      return;
    }

    await dappPreloadTables();

    const noolPrivateKey = Ed25519PrivateKey.generate();
    const noolPrivateKeyTwisted = new TwistedEd25519PrivateKey(noolPrivateKey.toString());
    const noolAccount = new Ed25519Account({ privateKey: noolPrivateKey });
    const noolAddress = noolAccount.accountAddress;

    // Fund the account with gas.
    console.log("Funding account with gas");
    const txn = await aptos.faucet.fundAccount({
      accountAddress: noolAddress,
      amount: 100000000,
      options: { waitForIndexer: false },
    });
    await aptos.waitForTransaction({
      transactionHash: txn.hash,
      options: { checkSuccess: true, waitForIndexer: false },
    });
    console.log("Funded account with gas");

    console.log("Registering balance if necessary");
    // Register the balance if necessary.
    try {
      const registerTxn = await confidentialAsset.registerBalance({
        sender: noolAccount.accountAddress,
        tokenAddress: usdtAddress,
        publicKey: noolPrivateKeyTwisted.publicKey(),
      });
      await sendTxn(noolAccount, registerTxn);
      console.log("Registered balance");
    } catch (e) {
      console.log("Error registering balance, probably already registered", e);
    }

    // Mint and deposit USDT many times.
    const numMints = 3;
    console.log(`Minting and depositing USDT ${numMints} times`);
    for (let i = 0; i < numMints; i++) {
      await mintUsdt(noolAccount, 10n);
      await depositToConfidentialAsset(noolAccount, 10n, usdtAddress);
    }

    // Fetch the encrypted balances from on chain.
    console.log("Fetching encrypted balances from on chain");
    const balances = await confidentialAsset.getBalance({
      accountAddress: noolAddress,
      tokenAddress: usdtAddress,
    });
    console.log("Encrypted balances fetched from on chain");
    console.log({
      actualRaw: balances.actual.map((el) => el.serialize()),
      pendingRaw: balances.pending.map((el) => el.serialize()),
    });

    // Decrypt the balances.
    console.log("Decrypting balances");
    const actual = await ConfidentialAmount.fromEncrypted(balances.actual, noolPrivateKeyTwisted);
    const pending = await ConfidentialAmount.fromEncrypted(balances.pending, noolPrivateKeyTwisted);

    console.log("Decrypted balances");
    console.log({
      actual: actual.amount,
      pending: pending.amount,
    });

    // Encrypt the balances again, which we would use for submitting txns.
    console.log("Encrypting balances");
    const actualEncrypted = actual.getAmountEncrypted(noolPrivateKeyTwisted.publicKey());
    const pendingEncrypted = pending.getAmountEncrypted(noolPrivateKeyTwisted.publicKey());

    console.log("Encrypted balances:");
    console.log({
      actualEncrypted: actualEncrypted.map((el) => el.serialize()),
      pendingEncrypted: pendingEncrypted.map((el) => el.serialize()),
    });
  }, 80000);
});

// This is the preload tables function in the dapp.
export const dappPreloadTables = async () => {
  const kangaroo16 = await createKangaroo(16);
  const kangaroo32 = await createKangaroo(32);

  const decryptChunk = (pk: Uint8Array, instance: WASMKangaroo, timeoutMillis: bigint) => {
    if (bytesToNumberLE(pk) === 0n) return 0n;

    const result = instance.solve_dlp(pk, timeoutMillis);

    if (!result) throw new TypeError("Decryption failed");

    return result;
  };

  ConfidentialAmount.setDecryptBalanceFn(
    async (encrypted: TwistedElGamalCiphertext[], privateKey: TwistedEd25519PrivateKey) => {
      const mGs = encrypted.map((el) => TwistedElGamal.calculateCiphertextMG(el, privateKey));

      const olderChunks = mGs.slice(0, encrypted.length / 2).map((el) => el.toRawBytes());
      const yongerChunks = mGs.slice(-(encrypted.length / 2)).map((el) => el.toRawBytes());

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error("Decryption timed out after 55 seconds");
          reject(new Error("Decryption timed out after 55 seconds"));
        }, 55000);

        Promise.all([
          ...olderChunks.map((el) => decryptChunk(el, kangaroo16, 1500n)),
          ...yongerChunks.map((el) => decryptChunk(el, kangaroo32, 3500n)),
        ])
          .then((result) => {
            clearTimeout(timeout);
            resolve(result);
          })
          .catch((err) => {
            clearTimeout(timeout);
            reject(err);
          });
      });
    },
  );
};

async function mintUsdt(account: Ed25519Account, amountInUsdt: bigint) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      // TODO: Do something smarter than just hardcode this.
      // function: `0x33c6f1c080cffdb8bc57dbd93bf2e4f10420f729bedb430ffd79c788518e0f86::mock_token::mint_to`,
      // This is testnet USDT:
      function: `0x24246c14448a5994d9f23e3b978da2a354e64b6dfe54220debb8850586c448cc::usdt::faucet`,
      functionArguments: [amountInUsdt * 10n ** 6n],
    },
  });
  await sendTxn(account, transaction);
}

async function depositToConfidentialAsset(account: Ed25519Account, amountInUsdt: bigint, usdtAddress: string) {
  const transaction = await confidentialAsset.deposit({
    sender: account.accountAddress,
    to: account.accountAddress,
    tokenAddress: usdtAddress,
    amount: amountInUsdt * 10n ** 6n,
  });
  await sendTxn(account, transaction);
}

async function sendTxn(account: Ed25519Account, transaction: SimpleTransaction) {
  const res = await aptos.signAndSubmitTransaction({ signer: account, transaction });
  await aptos.waitForTransaction({ transactionHash: res.hash, options: { checkSuccess: true } });
}
