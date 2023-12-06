import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { AccountAddress, Aptos, AptosConfig,  parseTypeTag, Network, Secp256r1PublicKey,
  U64, } from "@aptos-labs/ts-sdk";

const APTOS_COIN = "0x1::aptos_coin::AptosCoin";
const ALICE_INITIAL_BALANCE = 100_000_000;
const BOB_INITIAL_BALANCE = 100;
const TRANSFER_AMOUNT = 7777777;
const COIN_STORE = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
const BOB_ADDR = "0x6c2fe73e11ed74b32a2f583f4df93190edd521d023925d148fbf7d66a2891835"

function App() {
  const [credentialId, setCredentialId] = useState<string | null>(
    window.localStorage.getItem("credentialId")
  );

  const [publicKey, setPublicKey] = useState<string | null>(
    window.localStorage.getItem("publicKey")
  );

/**
 * Prints the balance of an account
 * @param aptos
 * @param name
 * @param address
 * @returns {Promise<*>}
 *
 */
const balance = async (aptos: Aptos, name: string, address: AccountAddress) => {
  type Coin = { coin: { value: string } };
  const resource = await aptos.getAccountResource<Coin>({
    accountAddress: address,
    resourceType: COIN_STORE,
  });
  const amount = Number(resource.coin.value);

  console.log(`${name}'s balance is: ${amount}`);
  return amount;
};

  // Create the passkey via credential registration ceremony
  const createPasskey = async () => {
    const options = await aptos.generateRegistrationOptions({
      rpName: window.location.origin,
      rpID: window.location.hostname,
      userName: "Andrew",
      userID: "andrew.apt",
      authenticatorAttachment: "platform"
    });

    const cred = await aptos.registerCredential(options)

    setCredentialId(cred.rawId);
    setPublicKey(aptos.parsePublicKey(cred).toString());
    window.localStorage.setItem("credentialId", cred.rawId);
    window.localStorage.setItem("publicKey", aptos.parsePublicKey(cred).toString());
  };

  const fundAccount = async () => {
    if (!publicKey) {
      alert("No registered publicKey");
      return;
    }

    const addr = await aptos.getPasskeyAccountAddress({publicKey})

    await aptos.faucet.fundAccount({
      accountAddress: addr.toUint8Array(),
      amount: ALICE_INITIAL_BALANCE,
    });

    console.log("\n=== Balances ===\n");
    await balance(aptos, "Passkey Account", new AccountAddress(addr.toUint8Array()));
  }

  const fundBobAccount = async () => {
    await aptos.faucet.fundAccount({
      accountAddress: AccountAddress.fromString(BOB_ADDR),
      amount: BOB_INITIAL_BALANCE,
    });

    console.log("\n=== Balances ===\n");
    await balance(aptos, "Bob Account", AccountAddress.fromString(BOB_ADDR));
  }

  const checkBalance = async () => {
    if (!publicKey) {
      alert("No registered publicKey");
      return;
    }

    const addr = await aptos.getPasskeyAccountAddress({publicKey})

    console.log("\n=== Balances ===\n");
    const bal = await balance(aptos, "Passkey Account", new AccountAddress(addr.toUint8Array()));

    window.alert(bal);
  }

  const checkBobBalance = async () => {

    console.log("\n=== Balances ===\n");
    const bal = await balance(aptos, "Bob Account", AccountAddress.fromString(BOB_ADDR));

    window.alert(bal);
  }

  /**
   * Use the passkey credential registered to the user to sign a coin transfer
   */
  const signWithPasskey = async () => {
    if (!credentialId) {
      alert("No registered credential");
      return;
    }

    if (!publicKey) {
      alert("No registered publicKey");
      return;
    }

    const addr = await aptos.getPasskeyAccountAddress({publicKey})

    const txn = await aptos.build.transaction({
      sender: addr,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [parseTypeTag(APTOS_COIN)],
        functionArguments: [AccountAddress.fromString(BOB_ADDR), new U64(TRANSFER_AMOUNT)],
      },
    });

    console.log("\n=== Transfer transaction ===\n");
    // const committedTxn = 
      await aptos.signAndSubmitWithPasskey({ 
        credentialId: credentialId, 
        transaction: txn, 
        publicKey: new Secp256r1PublicKey(publicKey),
      });

    // This doesn't work until the indexer works for passkeys
    // await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    // console.log(`Committed transaction: ${committedTxn.hash}`);
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Passkeys Demo</h1>
      <div className="card">
        <div className="comfy-row">
          <button onClick={createPasskey}>Create credential</button>
          <button onClick={fundAccount}>Fund Account</button>
          <button onClick={checkBalance}>Check Balance</button>
          <button onClick={signWithPasskey}>Sign with credential</button>
          <button onClick={fundBobAccount}>Fund Bob Account</button>
          <button onClick={checkBobBalance}>Check Bob's Balance</button>
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>rpId: {window.location.hostname}</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
