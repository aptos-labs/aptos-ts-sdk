# Snippet Library

Use these snippets as composable blocks. Keep outputs modular unless user asks for full runnable file.

## 1) Client Setup

```ts
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const network = (process.env.APTOS_NETWORK as Network) ?? Network.DEVNET;
const aptos = new Aptos(new AptosConfig({ network }));
```

## 2) Build Simple Transaction

```ts
const tx = await aptos.transaction.build.simple({
  sender: sender.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipient, amount],
  },
});
```

## 3) Simulate (Optional)

```ts
const [sim] = await aptos.transaction.simulate.simple({
  signerPublicKey: sender.publicKey,
  transaction: tx,
});
if (!sim.success) throw new Error("Simulation failed");
```

## 4) Sign + Submit + Wait (Single Signer)

```ts
const auth = aptos.transaction.sign({ signer: sender, transaction: tx });
const pending = await aptos.transaction.submit.simple({
  transaction: tx,
  senderAuthenticator: auth,
});
const executed = await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 5) Sponsored Transaction

```ts
const tx = await aptos.transaction.build.simple({
  sender: sender.accountAddress,
  withFeePayer: true,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [recipient, amount],
  },
});

const feePayerAuth = aptos.transaction.signAsFeePayer({ signer: sponsor, transaction: tx });
const pending = await aptos.signAndSubmitTransaction({
  signer: sender,
  transaction: tx,
  feePayerAuthenticator: feePayerAuth,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 6) Multi-Agent Transaction

```ts
const tx = await aptos.transaction.build.multiAgent({
  sender: alice.accountAddress,
  secondarySignerAddresses: [bob.accountAddress],
  data: {
    bytecode,
    functionArguments: [arg1, arg2],
  },
});

const aliceAuth = aptos.transaction.sign({ signer: alice, transaction: tx });
const bobAuth = aptos.transaction.sign({ signer: bob, transaction: tx });

const pending = await aptos.transaction.submit.multiAgent({
  transaction: tx,
  senderAuthenticator: aliceAuth,
  additionalSignersAuthenticators: [bobAuth],
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 7) External Signing Bridge

```ts
const tx = await aptos.transaction.build.simple({ sender, data });
const txBytes = tx.bcsToBytes();

// send txBytes (or aptos.getSigningMessage({ transaction: tx })) to external signer
const authenticatorBytes: Uint8Array = await externalSign(txBytes);

const auth = AccountAuthenticator.deserialize(new Deserializer(authenticatorBytes));
const pending = await aptos.transaction.submit.simple({
  transaction: tx,
  senderAuthenticator: auth,
});
await aptos.waitForTransaction({ transactionHash: pending.hash });
```

## 8) Predefined ABI

```ts
const tx = await aptos.transaction.build.simple({
  sender: sender.accountAddress,
  data: {
    function: "0x1::coin::transfer",
    typeArguments: [coinType],
    functionArguments: [recipient, amount],
    abi: transferAbi,
  },
  options: {
    accountSequenceNumber: knownSequence,
    gasUnitPrice: knownGasPrice,
    maxGasAmount: knownMaxGas,
  },
});
```
