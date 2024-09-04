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
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci0wIiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.eHqJLdje0FRD3UPmSw8sFHRYe9lwqSydAMcfHcpxkFwew2OTy6bWFsLQTdJp-eCZPhNzlfBXwNxaAJZksCWFWkzCz2913a5b88XRT9Im7JBDtA1e1IBXrnfXG0MDpsVRAuRNzLWqDi_4Fl1OELvoEOK-Tl4cmIwOhBr943S-b14PRVhrQ1XBD5MXaHWcJyxMaEtZfu_xxCQ-jjR---iguD243Ze98JlcOIV8VmEBg3YiSyVdMDZ8cgRia0DI8DwFn7rIxaV2H5FXb9JcehLgNP82-gsfEGV0iAXuBk7ZvRzMVA-srE9JvxVOyq5UkYu0Ss9LjKzX0KVojl7Au_OxGA",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci0xIiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.AS1NTZSzPf9Pzv-12mZ2ozKYf1XxlHGn58GpKpe9odFquQ9YHD3klnwN-dM93keSNL6K9MyPh33SBZ1mzWSRxhC2by_9qOf410QgmH27_CxJdy1w2oLaVMCL0JmQUB7IsMcrVr1SflV6hNeqDoRfGzwM4kl2ocutLoRcm2cm52s2aPBajb43qTIeuK3CoJwIS4tfU9LhiqofpQ_zeFpk4yv0YmYzoI8QT3cVQDxtli90g0_VtUtaIFiF63uJrGh0dpt8mISNGKccRnDEtb-DrdnEdGoQQFFLTwJQXG8dvcCPEkt1qbL7-iUZxW2h9oU4XnKK_1kxe63K2Lp0O3XbEg",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci0yIiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.IGxHuaxvNZTpxIU1YgPmJ8nA85xj21JpYELpIxMQPeoeX1Jd9LkpNp71GkSacI9GGzDjRzCCyVlP31EEHO321VwJt2cBDBIKN75cthxM3wJAirL3IkcvF4cOGRmYoIwJo94U2qtIrV2hsUkAFrzQBQeG8kw-_f1h9dFZOJwJ21YJK0jsocsKWxm3cMjpLFm6lbVfGBlZDFQlAPctf6FvVrdzQx-L3bNFrVaXd_ONlBzxur1hZVIgzvcqdc1vk7hcITGEAOu5Kl2fA-WobIobVBgJsiLUUTqHQjQpW2hARZWKF41nvRQzExVBjb2V5DemgEz5WYIqj6MPvsQNQos1vQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci0zIiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.pKTMY9nOVj3_XYCkLhrNIqXdxX5o5it8dtQQmmm8ct8utZJT1ILPtv7iXwLo8fMN4O8RQIfjqRC8DorQ1u7pwkrTB0yL4WsOGFBoeRrDes0cOrqv8ACqmcU3Xy0Gq_qyPNQ9lyOGOeaiW39GiybvxlxPVPvN4D_bL6JQTxjiqpkAWquXRtYu_IbmZ6Nlo_kNUX34vsd3xeeIKBNk06xBeMk0Euc5Cs5mipt7Vt8YeZG0EEHbmUFc4eG9-BKO4Zjsay7cXx8fCvKUXzdbGzPlWXVW-E4xoGJHFVmNfhbua2VJ6scz1GkWHUR-evnHlukPIAmmgMWcBlPfaqftDGMpew",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci00IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.OmHSYoRgP8i8BCT7IbM8U4VxEwtW68VMYOoUmMVdDpG3fPeupPVBr1EzdeJtB3B0gMiyD6W2mPVvcohSJJFNQFIGlUNP4e9ge2_b5fuC3bgI8UdAMKblt7FotYpkqGxeU-DEErioto5MXTzSi1UwQH4zmxQ1hDIOgYScNfO2LyHMueKz67FzDgIUm470AFLmc8TBrWVPXEyYWFdtpDO5yl_yplbQEXf0Z0tYpnHTwYgijnxAsNZ-_lX7CdorXSBZSXtpXHjwCl5WJv8cC65oxQLqVIsqwwdWzvtnZEHpLeERVt7NHyLHu7zfh1lohtZ6ulkKAr0Aot0r8BF0evy8mg",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci01IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.TbhkVpFaM3MTq1iAMNzI8ki0jX6PrtBmFkjASphGzlGdPBHVzwfbjTz0dEMXeKYAjggFJmhCinjsach5XYX0gQXIgIlb1xtde2xRxCe1SBZINmkCiJc7Bx19TXJnGNA74EBRwr6jEPGxhTMkrGRWXCedGKiuyc5Jg7znJTJ-pyc4cXV5YF6OWhQhx7voB9gotWECfnuumdx-AFq4C4Y3f3W30CvaqDBXNg0C9aRQvnDMTyQdbh82tJfMS59mrKUtOlloiyExtmKEyF0dr6io3JHN-Om8V5Wo72gDHTQWo4oqR3BfHXRzOcjPHZ34x6tj6nC9Kj3LHRmaZa-19nqvwA",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci02IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.CVS5cqsXTFpkXBNxtk2ZDB2r6PeCpaT5MrqIBTulwx1p28dHZWe72Q0SdzRRc9oTWqk-u8yBYi_FY1v6A9YKGZHvXva80FmIWeOp4w4vnObOq_0TyDc6q-6_RO9h48WKy9fWlxhCFkTgzWbvBWKK2SsDDkQXRMTYO9PyIQgh40Npr5_S7p55kTanMroi7nAC-4zO5p_RnpwbUVxJwoECON5yJ_OiVI8PaGZCOiBErLB-rMxn88I7v3N4OCOMdom5WFNNM06dacFFy4JZ5JDrrL390BHEtZ0Q-lF0k8LzLpy3jIjSa0tnJOs5FTjgbT0wMGP8wpZPQE_1gPbCcyq7FQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci03IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.tps0gbu7xegBEMKRGOjltzhv0Ifg_35V1onFfxH4byxbmfOf0hkTbUqrLjFj9ZX31gIP6GRew68MQ6aqyvV4gEb5itnRTHXINVOfjCeFBxQvl94mgnMO5bE1bztSpYLYT6o90Jz6ZC-jwExu3MBFJHCLrSfZy-zdQe_5onkE4RnLsHuesMI7BxSCLHfSQdy7ZoRRx1yhhwTjB-JSQuugBP4j9hC5Ep7lfvIt3JPJoXFdY_JdlgtfQnHNACRTzeOLZEHA_u906OusBioql0ocmEwcCLtvecu7h3Z-IFIugja1kmocJYDhgyvVp2mbcdXlTlA7eb0KhCpEi__IBRPxUw",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci04IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.FBTeSMj5nunVsZcL-poKbcdrEBDfZpEkoPjg87fOHkrFIrQUHWX6SFpUxoY_t-OwJ7cAb85655ytGPGm4kIFKqJru8DMXwt6M5KG9ir8p8FXLsw-z2KJ7COaEItqnEIS4EHC_HTveluLdV66yZ4DfXEakFyZVhX89Ys3KQe_xMl73c2hPBQQHwieZJeuqkA2zEFhqlr-pLmqFeZm9onHITc4XIl_uFKw-F7zfUvxz5ix7pjjltVylxtjpjuW8Z29kC8PjoaneaJamuA8a8mjwZXOI7mg6c8EuLTCdmZfBZto183qHtmlaKm_1LCky80dfRAY3lSZw_9E8QseBscVfQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci05IiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzI1NDc1MTEyLCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiNzA5NTI0MjMzMzk2NDQ1NzI2NzkzNDcyMzc2ODA4MDMwMzMyNDQ2MjgyMTE5MTc1NjQwOTQ1MDA5OTUxOTc4MTA1MTkxMDE4NzExOCJ9.B3CubAPmu51Ysl7nlhYmGnzgJKjcF6H5A7D5pgjXCXvX7FWA7fwvar0y7TdSj7VSR45TLS5qLd0Iro9zfk_7rhRtNiRQYH5_SyOljCQCiIHs8FHCjZJlcCAqLILQbPinwFXe_LlSMekwAzgXd0ugPyPjSSwI32jkIkGHmif1zAfgWPw6FE6B3x4L_SMWublc4kOBsiGB4zQ2MiMlLK4alVoOatIVOJIC9Q2rGwDR-Pny4xIym6Z96Z1wZR_612RlUs52LSaHnCJn972fm1xhNMqlLhD_6BPP0U0vkrXfGI7PezfIEXDB2X6KLPgnasJcmvMWaPg7Hsrni4kapzGM2g",
];

export const EPHEMERAL_KEY_PAIR = new EphemeralKeyPair({
  privateKey: new Ed25519PrivateKey("0x1111111111111111111111111111111111111111111111111111111111111111"),
  expiryDateSecs: 1735475012, // Expires Sunday, December 29, 2024 12:23:32 PM GMT
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
      "keyless account verifies signature for arbitrary message correctly",
      async () => {
        // Select a random test token.  Using the same one may encounter rate limits
        const jwt = TEST_JWT_TOKENS[Math.floor(Math.random() * TEST_JWT_TOKENS.length)];
        const sender = await aptos.deriveKeylessAccount({ jwt, ephemeralKeyPair });
        const message = "hello world";
        const signature = sender.sign(message);
        expect(sender.verifySignature({ message, signature })).toBe(true);
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
