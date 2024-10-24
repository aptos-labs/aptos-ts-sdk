/* eslint-disable max-len */
/* eslint-disable no-console */

/**
 * This example shows how to use install JSON Web Key Set (JWKS) on an account to support Federated Keyless Accounts
 */

import { Aptos, AptosConfig, EphemeralKeyPair, Network } from "@aptos-labs/ts-sdk";
import * as readlineSync from "readline-sync";

const example = async () => {
  const config = new AptosConfig({ network: Network.DEVNET });
  const aptos = new Aptos(config);

  // Generate the ephemeral (temporary) key pair that will be used to sign transactions.
  const ephemeralKeyPair = EphemeralKeyPair.generate();

  console.log("\n=== Federated Keyless JWK Installation ===\n");

  const link = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?redirect_uri=https%3A%2F%2Fdevelopers.google.com%2Foauthplayground&prompt=consent&response_type=code&client_id=407408718192.apps.googleusercontent.com&scope=openid&access_type=offline&service=lso&o2v=2&theme=glif&flowName=GeneralOAuthFlow&nonce=${ephemeralKeyPair.nonce}`;
  console.log(`${link}\n`);

  console.log("1. Open the link above");
  console.log("2. Log in with your Google account");
  console.log("3. Click 'Exchange authorization code for tokens");
  console.log("4. Copy the 'id_token' - (toggling 'Wrap lines' option at the bottom makes this easier)\n");

  function inputJwt(): string {
    return readlineSync.question("Paste the JWT (id_token) token here and press enter:\n\n", {
      hideEchoBack: false,
    });
  }

  function inputIss(): string {
    return readlineSync.question(
      "\nInput the iss claim of your federated OIDC provider and press enter (e.g. https://dev-qtdgjv22jh0v1k7g.us.auth0.com/):\n\n",
      {
        hideEchoBack: false,
      },
    );
  }

  const jwt = inputJwt();
  const iss = inputIss();

  const alice = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair,
  });
  await aptos.fundAccount({
    accountAddress: alice.accountAddress,
    amount: 100_000_000,
  });

  const jwkTxn = await aptos.updateFederatedKeylessJwkSetTransaction({ sender: alice, iss });
  await aptos.signAndSubmitTransaction({ signer: alice, transaction: jwkTxn });

  console.log("\n=== Addresses ===\n");
  console.log(`JWKs were installed at - ${alice.accountAddress}\n`);
  console.log("Use it to construct Federated Keyless Accounts for your federated JWT tokens\n\n");
  console.log(
    `await aptos.deriveKeylessAccount({\n  jwt,\n  ephemeralKeyPair,\n  jwkAddress: "${alice.accountAddress}",\n});`,
  );
};

example();
