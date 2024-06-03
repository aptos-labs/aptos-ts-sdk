/* eslint-disable max-len */
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  Account,
  Ed25519PrivateKey,
  EphemeralKeyPair,
  KeylessAccount,
  KeylessPublicKey,
  ProofFetchStatus,
} from "../../../src";
import { FUND_AMOUNT, TRANSFER_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";
import { simpleCoinTransactionHeler as simpleCoinTransactionHelper } from "../transaction/helper";

export const TEST_JWT_TOKENS = [
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTAiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.YQGVRJ8wA9UgZ48VFPuxxMSPhPpeR7XNd1M-yw-3aCLUY1OAL1z_UXVqd2RB1SqaPZ4CD2BBm9txvIY7qfS4V0-Bk0tW6TeRo8iq8oL52-TIm8aCg1GQ2CmdJ_eEtFoW5AaEzX3mblWcinwTbfnrlhy-cdJxGq6EKIzQZc_AylScrYHj4dSEmq33EuaBTpF0HHyf8UmJvoe-PZhVjuj73gy10vhITtLe1Cq6A-fjAJ00BEJCa9ghke17hDXibEBLCO2tFuqggL37am5fMAmmZ0-x1rXcKub-LXyuV1Gc8OSVngBrseT7S2Sw4Gx1z3AN3bCzOJbPNTSFlwmzdIcuNQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTEiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.r5EXWtCVxRGtDYHLsYtOxxCVs0wQKM2QwUSg6NoHdSOBHpPlTdB0D4uGw_cS6uW2v8W8JxRWUagyAW93HMGrDGHVeBg3h8wmGR-gEWJqe2-kMxr6CpeHi6Xl5xoajWukQt1XAnuCpAF2U6i5biSx_3oerkS6zf1VX9KxUbnURVZtcrVqRS-1-isFjrrG2cDbBeX9X1i8qdyIJd0l1TTgD0BVI1uFCAIVEwSZ8w4haDTKj2JJOhtZCaeV-H8jqhRHVWXKn0xP1giUvChRz4dBuUdXK7YsYP9nCrAQiCm2MIwNmCPsxH4racb4MZn6PWJZXNpLpWjZ3WV9H4IBo8tR9A",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTIiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.JVXx2JmeZEgAtAXRmniQVscxgTtYRliGVyfclIYe7F5UUQAz2szwkNSuDlaW82myfuqUkbKgih3G3YK9GDh4Y1B1TcZT7_J2EVyj6s9QNmEQmf0Nlr31BQIJAOSGHNsTzkQ3at0c1lLbFd8ZpjI_ey8LVdOvLGBBErVJGlj89M158Jwl0E34GjRB8iWbC0WKS3A-T_IOtsu_VDOApQuIiOtS7LLAsGQcXWZGcykk2q5TwKui92gBw9vyRBB3FVOTtXssqEU7zRhtkUY6_L7mN7Z4zEVnlnZP_jtjjDtMCfFzbZSp_MP-ZmCdDPjjTH6QKfdQUB8ajqrDI7irEKsvqA",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTMiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.A5kmVT9dJAEz4GW7jglczCqgrmYinGWxfm9f1-A882kmk0tKQem3ZxDUjySRKj0725sJs3Rrbdhi2Jyk77FNADqoQ6bj1RA6SXguf0BG4iHvSc4CrtdzD9PHQjGQ1gC0LZBUgdKoKkp4C9eicu38cr4lbrW2XSeCCpy02SNSUwBtOoI7jrb_Q2YiOpK1g0fivNHM3Q3Crpy8gSvnim0xHsRylvs7UmDqLAeN2K7py-4MJOX9MgZStMqPkQMbcf-FDaYRaNUfP0uR48ZwfWATujRJenEYkOPupeFWhrh-DzL3OfqLzGg2oW0oq-EkROqdPpRgUCsT7jULps_sEensbQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTQiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.P5mWnTPNb00sAVdRir2qfsRXEZ2qCWslgnTTWiRsGVOuXsnkSPG4kLcQFVbPz8p_VwN-uqZHacrPZdZiN5LAdyAzxzVN-1cyfWDzt7Qwf95DDLlJkg4euNWXt3qrJR6th2QbHpzf5TJPxAXLRQpQJTO8gYKyFcX-izz8WDPRjeRU9e3cQ2pGOz3gXwXkHsylmC8y9obnhLqaMdDrX6-jUg2HTZsjNMH_7ZGd6oWKaE9SPTu0gR-tcluniC7YNAeXXv0AbqNEZ9WM_DcoIWvqlJzKnIuc-64Yj2cYMdgU8eDvgxN83khHFzQ9aP_BY_AtUdrFQwCXMEjNbSAw4P1WxA",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTUiLCJlbWFpbCI6InRlc3RAYXB0b3NsYWJzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3MTcwMzk0ODQsImV4cCI6MjcwMDAwMDAwMCwibm9uY2UiOiI5MzYxNTQ1NTI0OTIwMDQ4ODA2NTM0NjQwNDk4NTAzODg0OTU0ODY1NTY3MzYyMTA3MzQ5MjIxMzAwMjg0MjA5ODc1MDkxMzYyMjI5In0.ZX6QhX1An2KEbN755Et_u2gfXaC-UTv778Fl0E8kDf4_rqSbdDNdG4VysU0ASBtjZ4k1YKcOpZyz1BhqeQ9vp3A-M6niy2CFFcBoyXeXE_lzsbOizhBHQhLQaCCAlefn4gAGFH5cfK094vI2uHAffUx_XUki139Fapf-JJunSC4z34jiPiTkTO_Yfgx-XYXbI5h9AcFvtgYqLDZQ6Goigv-Rx7QK9iEKYnxqpROW1LDRdUyYLHJMUHAlsVMbnER4lM3IXTlb44XcGwFZuBqKeD2SyBDU_hDUjykwRf8b6Fg9h7k2YFAGwJkKybQmLrncM5PSNjUQ2g37hr80XM3yRQ",
];

export const EPHEMERAL_KEY_PAIR = new EphemeralKeyPair({
  privateKey: new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111"),
  expiryDateSecs: 1724497501, // Expires Saturday, August 24, 2024 11:05:01 AM GMT
  blinder: new Uint8Array(31),
});

const KEYLESS_TEST_TIMEOUT = 12000;

describe("keyless api", () => {
  const ephemeralKeyPair = EPHEMERAL_KEY_PAIR;
  // TODO: Make this work for local by spinning up a local proving service.
  const { aptos } = getAptosClient();

  beforeAll(async () => {
    // Fund the test accounts
    const promises = TEST_JWT_TOKENS.map(async (jwt) => {
      const pepper = await aptos.getPepper({ jwt, ephemeralKeyPair });
      const accountAddress = KeylessPublicKey.fromJwtAndPepper({ jwt, pepper }).authKey().derivedAddress();
      await aptos.fundAccount({
        accountAddress,
        amount: FUND_AMOUNT,
      });
    });

    await Promise.all(promises);
  }, 30000);
  describe("keyless account", () => {
    test(
      "derives the keyless account and submits a transaction",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const account = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair });
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, account, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "creates the keyless account via the static constructor and submits a transaction",
      async () => {
        const jwt = TEST_JWT_TOKENS[0];

        const pepper = await aptos.getPepper({ jwt, ephemeralKeyPair });
        const publicKey = KeylessPublicKey.fromJwtAndPepper({ jwt, pepper });
        const address = await aptos.lookupOriginalAccountAddress({
          authenticationKey: publicKey.authKey().derivedAddress(),
        });
        const proof = await aptos.getProof({ jwt, ephemeralKeyPair, pepper });

        const account = KeylessAccount.create({ address, proof, jwt, ephemeralKeyPair, pepper });
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, account, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "derives the keyless account with email uidKey and submits a transaction",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair, uidKey: "email" });
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, sender, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "derives the keyless account with custom pepper and submits a transaction",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair, pepper: new Uint8Array(31) });
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, sender, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "deriving keyless account with async proof fetch executes callback",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        let succeeded = false;
        const proofFetchCallback = async (res: ProofFetchStatus) => {
          if (res.status === "Failed") {
            return;
          }
          succeeded = true;
        };
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair, proofFetchCallback });
        expect(succeeded).toBeFalsy();
        await sender.waitForProofFetch();
        expect(succeeded).toBeTruthy();
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, sender, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "derives the keyless account with async proof fetch and submits a transaction",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const proofFetchCallback = async () => {};
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair, proofFetchCallback });
        const transaction = await aptos.transferCoinTransaction({
          sender: sender.accountAddress,
          recipient: sender.accountAddress,
          amount: TRANSFER_AMOUNT,
        });
        const pendingTxn = await aptos.signAndSubmitTransaction({ signer: sender, transaction });
        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "deriving keyless account with async proof fetch throws when trying to immediately sign",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const proofFetchCallback = async () => {};
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair, proofFetchCallback });
        const transaction = await aptos.transferCoinTransaction({
          sender: sender.accountAddress,
          recipient: sender.accountAddress,
          amount: TRANSFER_AMOUNT,
        });
        expect(() => sender.signTransaction(transaction)).toThrow();
        await sender.waitForProofFetch();
        sender.signTransaction(transaction);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "deriving keyless account using all parameters",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const proofFetchCallback = async () => {};
        const sender = await aptos.deriveKeylessAccount({
          jwt,
          ephemeralKeyPair,
          uidKey: "email",
          pepper: new Uint8Array(31),
          proofFetchCallback,
        });
        const recipient = Account.generate();
        await simpleCoinTransactionHelper(aptos, sender, recipient);
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "simulation works correctly",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair });
        const transaction = await aptos.transferCoinTransaction({
          sender: sender.accountAddress,
          recipient: sender.accountAddress,
          amount: TRANSFER_AMOUNT,
        });
        await aptos.transaction.simulate.simple({ signerPublicKey: sender.publicKey, transaction });
      },
      KEYLESS_TEST_TIMEOUT,
    );

    test(
      "serializes and deserializes",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair });
        const bytes = sender.bcsToBytes();
        const deserializedAccount = KeylessAccount.fromBytes(bytes);
        expect(bytes).toEqual(deserializedAccount.bcsToBytes());
      },
      KEYLESS_TEST_TIMEOUT,
    );
  });
});
