/* eslint-disable max-len */
// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import * as browser from "@simplewebauthn/browser";
import { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server/esm/deps";
import { AccountAddress, Secp256r1PublicKey } from "../../../src";
import { getPasskeyAccountAddress, parsePublicKey } from "../../../src/internal/passkey";
import { FUND_AMOUNT } from "../../unit/helper";
import { getAptosClient } from "../helper";

const PASSKEY_TEST_TIMEOUT = 12000;

const testCredentialJSONObject = {
  id: "ou6iPvirmyfwxymZ-TogFw",
  rawId: "ou6iPvirmyfwxymZ-TogFw",
  response: {
    attestationObject:
      "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NdAAAAALraVWanqkAfvZZFYZpVEg0AEKLuoj74q5sn8Mcpmfk6IBelAQIDJiABIVgg-Aw8wvwYzq8QlltKiXtEQSVa8uHJpJaJ1F9AAoL2Q6ciWCA7Xroa2iNudxIqgFG1IdNGTniiKCIk-hIn2ktswN6p9A",
    clientDataJSON:
      "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiZ3Jod2t5cVBydTZEamhsZ3hfWFF5NjZmZVNGdl9rZm9raVpsS1FGTGxsTSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
    transports: ["internal", "hybrid"],
    publicKeyAlgorithm: -7,
    publicKey:
      "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE-Aw8wvwYzq8QlltKiXtEQSVa8uHJpJaJ1F9AAoL2Q6c7Xroa2iNudxIqgFG1IdNGTniiKCIk-hIn2ktswN6p9A",
    authenticatorData:
      "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NdAAAAALraVWanqkAfvZZFYZpVEg0AEKLuoj74q5sn8Mcpmfk6IBelAQIDJiABIVgg-Aw8wvwYzq8QlltKiXtEQSVa8uHJpJaJ1F9AAoL2Q6ciWCA7Xroa2iNudxIqgFG1IdNGTniiKCIk-hIn2ktswN6p9A",
  },
  type: "public-key",
  clientExtensionResults: {
    credProps: {
      rk: true,
      authenticatorDisplayName: "1Password",
    },
  },
  authenticatorAttachment: "platform",
} as RegistrationResponseJSON;

const testAuthenticationResponseObject = {
  id: "ou6iPvirmyfwxymZ-TogFw",
  rawId: "ou6iPvirmyfwxymZ-TogFw",
  response: {
    authenticatorData: "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MdAAAAAA",
    clientDataJSON:
      "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoib2U1MlRmWXNYYlNuOVNxamQtdUtka2dMOWZBQjdLc3VlbFUwTmwtWm54USIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
    signature: "MEYCIQDO-9LxaDNBEBa4pyquUcyuhsegDWM_aR5-wpLIjQT4hwIhAI8yK8ZAxWtRfkDNFxkwZm4SC-yhHCLMjgtwcbdHzG3_",
    userHandle: "tsSuOOp-4_KUAp9B7-M_EPFwl3giI4cdOzvFiUbDoMM",
  },
  type: "public-key",
  clientExtensionResults: {},
  authenticatorAttachment: "platform",
} as AuthenticationResponseJSON;

const { aptos } = getAptosClient();

describe("passkey api", () => {
  describe("passkey account", () => {
    test("get passkey account pubkey and address", async () => {
      const pubKey = parsePublicKey(testCredentialJSONObject);
      const address = await getPasskeyAccountAddress({ publicKey: pubKey.toString() });
      expect(pubKey.toString()).toBe(
        "0x04f80c3cc2fc18ceaf10965b4a897b4441255af2e1c9a49689d45f400282f643a73b5eba1ada236e77122a8051b521d3464e78a2282224fa1227da4b6cc0dea9f4",
      );
      expect(address.toString()).toBe("0x5f48dc0b134ef412f1e740deb9795a099a416c4a56d145ff0786234517d525e8");
    });
  });

  describe("passkey sign", () => {
    test(
      "sign with passkey",
      async () => {
        const spy = jest.spyOn(browser, "startAuthentication");
        spy.mockReturnValue(Promise.resolve(testAuthenticationResponseObject));

        const pubKey = parsePublicKey(testCredentialJSONObject);
        const address = await getPasskeyAccountAddress({ publicKey: pubKey.toString() });
        await aptos.fundAccount({ accountAddress: address, amount: FUND_AMOUNT });
        const recipient = AccountAddress.fromString("0x1");
        const rpID = "localhost";
        const credentialId = testCredentialJSONObject.id;

        const txn = await aptos.transferCoinTransaction({
          sender: address,
          recipient,
          amount: 1 * 1e8,
        });

        const pendingTxn = await aptos.signAndSubmitWithPasskey({
          credentialId,
          transaction: txn,
          publicKey: new Secp256r1PublicKey(pubKey.toString()),
          rpID,
          options: {},
        });

        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        spy.mockRestore();
      },
      PASSKEY_TEST_TIMEOUT,
    );
  });
});
