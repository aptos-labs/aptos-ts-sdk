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
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTAiLCJlbWFpbCI6InRlc3QwQGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.ZLZRVJpYfxjNBIdQjeLEniuUsMuBQ7zYm0R0bzKdoIFO4uDTcGrg50-ao_2t89A6EYO0p1uvOC_zCtYsAE57i36kvnX5zCCJwpu7-tMLGsOWCR56H22PgSD7GUcmOp4uePbMPPXp753YrNnlbArEQztfQssI6ScyMVQzNDYW7z2V6esB_GtkEaQzsKDEExDPKC_JBBI__Mek7SQLjFDjbBnWJsGuL4fp2Ux0GVJTaTFvFZMNfNzSQX3Mi93dJFu67xt4UwMUoOxPF1C63SPM53DPBPBPK71dEHug3Z4afgswyEZfNHSotMfhT7D1IEaOzKJnoCSwML5eP0VA0bmGRQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTEiLCJlbWFpbCI6InRlc3QxQGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.NeytBC3patHnUS7giCH_NcSBeekx6bpR18BX5Wzp0VNl7Bo56gytmADqOqQIF9m_VGD8YQ_ld4JV5G_tCWbpQYNoHr3gpLIb68cj0XP7bhE8D11GvYOYRM0z5h8JQmKv7tbRvZwK5EyFm3HOEX5M0vmjJBN_KNSBRsqSNMAZEe7e4zoO4Zu86X8CkfFcvONgtpsJGycoxk2gyZt8KGSB2OydVnurV8TMbQ7WcM3HdqQZjZMcl1Rh4_8nNGXs8AB29-LiPpaze9CRLiiZ031NXzdJMTUW6RIulJdDpC3zaTMEZs6b9m-NBqVqhkeUFTvpeImycDgp0421RQA-oDqI7g",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTIiLCJlbWFpbCI6InRlc3QyQGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.q8vx7OrbukWs1P-VT5GNK2OPzbduBtMahQNBpg4Nck6h0Z0a62teW8PT46ir3SohpyRa1pLVjky6akPXrqoyYdI3qdwhf3pFwV6iJAROXw0UhaPJXXCCzmzUuNgIp3drn_G2_KCVtOTntbysOFekwlYDsvMwsmFTfKKJWpZsVDPiw2MQ_A1v6gsxn7qP4OXfsaWxkZJtzOu5W17dVGnveeN4Y_3bkPjt-1AseHOpVyFKrDI60aR5fMMjXU4wpynjTKgVUlWsIyKHvULcMRPq42KeBno148rXFLBAFJ-RSl7SQ500yVsvuz7iWX7-MeSlwJQbiAjG2wULuXsvum_gUw",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTMiLCJlbWFpbCI6InRlc3QzQGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.YD3F9tc31DQ4xuWVbRLYAPjskojQDNOzYL7vJTrc_D595jXHQcBr1AZWxfwkc-ruzGFNthPuDkE-s3jSDZndqpqwffxcYYbF28vjnN6LwJPAMPGPUmxCbhGcrdoRnBXm7vmukLQbaYHNIByxb2B_fnpsje9a_Iq16lpfblJAhKR1PP0s1opZU9icC6VhPUalDwdpDYD0LmmUmqbVBTZH_6l0Ht4pQcfNIb6PAfW1a2TrNldY9ItsammikWPKqcWVdy1Cb5UhypxQdZYol9-6zqLCkvtCuxB1N8Q-Y7vb1SzgV6vAmL3CsG-TPmZ-9rGvtbxwl69Wf0rk6zJ8hW26Dg",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTQiLCJlbWFpbCI6InRlc3Q0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.C2AEJyqoZzmPo_IHwwD0uwUf8WOdgKydSCJ_tQsWl7xKYjqqnzQZp9IArwGKT6ZeQ5QYNVyl6WgXEP8xQfMB6khVJayDjdHeqTwp4_Nf7uadeR3_2YpTOtFy42lp3l7_N2NBacMgAduXbzLLq2NEyuYA7m_51NuvVb01ZsR_yn_1HgBNtd50Uz6bE9jviehk7zHNgDzLzogO1WsXRKevMoJs4NlY4qx9jPxs90KHVXm315UvcTYwiKU8B_esRf1lbJJjIQfcmhzRJ3_WgTEZSRW6xbLIetOTJUIDmI08JQ_48wG4-4QWSLIvipztdRwElrKHpcXNXjaRnKhVjsCN9g",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTUiLCJlbWFpbCI6InRlc3Q1QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.o-dHqzErid5CMPQTFRbJU5d7JMlud8hY9_USG9d52H35J20XJeJ5SM1ldt1PNqA4cxNWjPhyiQtrRzKeqwEMlIZ_hwyr1u6w2GkynR5yGR_G5_0_zj_Pbh0vnsgFH8XxLKedpDWQD7hyjZ2qL7V_7odnuJioqz6-hUtrFQzRs6RcVEwu2DaZrdb46zkvF3F6XO3qQjmcMvpKKfn4xwBFmEguQOygviXuCs3b_pELBOQM2eY822KsQMRfAuz9bmaFiX2NFM6uE5rPDL0wzy_VauZylFi1MoEEdpUR0LcyzwKnrLoxbooAjtOR2onWSeHDs0gmq0oT4mazY9ox1XTGGA",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTYiLCJlbWFpbCI6InRlc3Q2QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.kSTHhFMnZPbV-qW1R_gPIYKNW_VtFbUSDM8w8uMSJmUM7xfAN0Vbj4SjEkkpyeNA-8wUNzx7IqUpRW9cZswsIvg_VVtW1AVA-oLvEm_v4eX1eQ538Avt37lMteQdEM56b94-hv7WGHGfUJKeFvC-OcN7XAp4OYaFC2NheOUPfysB6WUVO94STfp9hz5x38P9lAM7scmXdnliaS5js8PchSbwuyAMOPRad_mHreeFB5LCFDUzNAK_SfUlhyULdrRJNfR3CroxtLy4nv94YyOuB36_b10gAp3cu8TPogpbW_yRWF37kcHSMAdupJuGuxh6qSROXn9oD9113rBXpepmMQ",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTciLCJlbWFpbCI6InRlc3Q3QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.DBCXh5FUT8MgoCDMTtDugZFy-XkyOHVfrKTr6dGHS3dJ5bQeeesEM8IgjO5_Rq9AjK_wwhdlHb1Y4xT8g1bILYqX77-nAMROYMRPlINXI9Hp1MrEEuT1HScsqzi1HkoxENEUgLsnoKn0qPDjXUOIRr3zmOAlQNW5UqUEeCNybwj61LmWtJg3s4D0cut7cLJCRgp2cLEIKQiDFyEtEIR301AxGmMN36dqxZL5gQ9j073U48YyY4g6uBaZS1CUrVda8hd6WEsg5qXK-huowPnEXo94W8cHJ75fyXD8Pv6fvcgYpq9cyS20YeuRr5hxb8x01ESwDxIfi5Y5v8Q9UHkjzg",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTgiLCJlbWFpbCI6InRlc3Q4QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.N-_GtyPt3Egv8QxpfX8KttxmRLjcye6tgbG-qYdPghTbYqhoUZz0MUMybWvoS2oChxWT1-Aatjk4xduy5rIjuT2ZPOnMe3uNsUk_QZaXHOgI3LBWYSn_SrAhztS6Nk9v2tsLzIFVtX7mS6scU2Y_iKldU825BJbyqIMLWs2HWyLCRU7xTp3-0SiBMvtiqh2UxH-Vniv1MzXu2kdivBiMELBXTvMWb2rLITFdKjUwLJo0dwfMZJjmgGWljdpiXJodbVPO8bH0ZWwZ3LY3dtNaZDguXBw3hkEZwEL9z-9dP2GdqTiCAB6kqCehTVkl8-JYLa_5rpYYPit9PTwVi-pg0A",
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3Mtc2RrIiwic3ViIjoidGVzdC11c2VyLTkiLCJlbWFpbCI6InRlc3Q5QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzE3MDM5NDg0LCJleHAiOjI3MDAwMDAwMDAsIm5vbmNlIjoiOTM2MTU0NTUyNDkyMDA0ODgwNjUzNDY0MDQ5ODUwMzg4NDk1NDg2NTU2NzM2MjEwNzM0OTIyMTMwMDI4NDIwOTg3NTA5MTM2MjIyOSJ9.LFPe_Czd92zHkay1BvSqiRuHHAGJFa25ZFGYq3SPJeCZ8vswy32JSMa7S07B7nHj92aBapfkfG8flqIRquUvUuc6MlXjQZTLU8lI7mWXPDAcZzsKiV7ZJnyn2Ir6tJmqLOWGS3tan3VUsu01hstd1qv0q6IGAYQ50OaeNoY73X0GLZ8QeB8CbodOPjrN_wG_qkIXLDwiacijmX7xc_-3-Sn1vl8BukE4HGC81SUA8xIKFxevQ7dvHRC5DcN2ZSOupgeCs__8rYB3NGN2bHv5ahzwqYaVH0n9pyZcM7r_FdC6stC8uUkiSFMQg_pSbI5wNT0WDJAgszsTkJmGsf0vdQ",
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
