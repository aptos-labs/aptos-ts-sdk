/**
 * Lite SDK Example
 *
 * This example demonstrates using the @aptos-labs/ts-sdk/lite entry point.
 * The lite SDK provides core functionality WITHOUT keyless authentication,
 * resulting in a significantly smaller bundle size.
 *
 * Bundle size: ~102KB minified (89% smaller than full SDK!)
 *
 * Best for:
 * - Frontend applications where bundle size matters
 * - dApps that don't need keyless authentication
 * - Wallet integrations
 * - Simple transaction signing and submission
 */

import {
  // Core types
  AccountAddress,
  Hex,
  AuthenticationKey,

  // Cryptographic primitives
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  Secp256k1PrivateKey,
  Secp256k1PublicKey,
  AnyPublicKey,
  AnySignature,

  // BCS serialization
  Serializer,
  Deserializer,
  MoveVector,
  U64,
  U8,
  Bool,

  // Network configuration
  Network,
  NetworkToNodeAPI,
  APTOS_COIN,
} from "@aptos-labs/ts-sdk/lite";

// Note: For API calls, you'll need to use fetch directly or a lightweight HTTP client
// The lite SDK focuses on cryptographic operations and serialization

async function main() {
  console.log("=== Lite SDK Example ===\n");
  console.log("The lite SDK is 89% smaller than the full SDK!\n");

  // 1. Generate keys
  console.log("1. Generating Ed25519 key pair...");
  const privateKey = Ed25519PrivateKey.generate();
  const publicKey = privateKey.publicKey();
  console.log(`   Private key: ${privateKey.toString().slice(0, 20)}...`);
  console.log(`   Public key: ${publicKey.toUint8Array().length} bytes`);

  // 2. Derive account address
  console.log("\n2. Deriving account address...");
  const authKey = AuthenticationKey.fromPublicKey({ publicKey });
  const accountAddress = authKey.derivedAddress();
  console.log(`   Address: ${accountAddress}`);

  // 3. Sign a message
  console.log("\n3. Signing a message...");
  const message = "Hello, Aptos!";
  const messageBytes = new TextEncoder().encode(message);
  const signature = privateKey.sign(messageBytes);
  console.log(`   Message: "${message}"`);
  console.log(`   Signature: ${signature.toUint8Array().length} bytes`);

  // 4. Verify signature
  console.log("\n4. Verifying signature...");
  const isValid = publicKey.verifySignature({
    message: messageBytes,
    signature,
  });
  console.log(`   Signature valid: ${isValid}`);

  // 5. BCS serialization
  console.log("\n5. BCS serialization...");
  const serializer = new Serializer();
  serializer.serializeU64(1000000n);
  serializer.serializeStr("Hello");
  const bytes = serializer.toUint8Array();
  console.log(`   Serialized ${bytes.length} bytes`);

  // 6. BCS deserialization
  console.log("\n6. BCS deserialization...");
  const deserializer = new Deserializer(bytes);
  const amount = deserializer.deserializeU64();
  const text = deserializer.deserializeStr();
  console.log(`   Amount: ${amount}`);
  console.log(`   Text: ${text}`);

  // 7. Working with addresses
  console.log("\n7. Working with addresses...");
  const addr1 = AccountAddress.from("0x1");
  const addr2 = AccountAddress.from("0x0000000000000000000000000000000000000000000000000000000000000001");
  console.log(`   Short form: ${addr1.toStringLong()}`);
  console.log(`   Are equal: ${addr1.equals(addr2)}`);

  // 8. Network endpoints (for manual API calls)
  console.log("\n8. Network configuration...");
  console.log(`   Testnet API: ${NetworkToNodeAPI[Network.TESTNET]}`);
  console.log(`   APT Coin type: ${APTOS_COIN}`);

  // 9. Secp256k1 support
  console.log("\n9. Secp256k1 key pair...");
  const secpPrivateKey = Secp256k1PrivateKey.generate();
  const secpPublicKey = secpPrivateKey.publicKey();
  console.log(`   Secp256k1 public key: ${secpPublicKey.toUint8Array().length} bytes`);

  // 10. AnyPublicKey wrapper (for unified auth)
  console.log("\n10. AnyPublicKey wrapper...");
  const anyPubKey = new AnyPublicKey(publicKey);
  const anyAuthKey = anyPubKey.authKey();
  console.log(`   AnyPublicKey auth key: ${anyAuthKey.derivedAddress()}`);

  console.log("\n=== Lite SDK Example Complete ===");
  console.log("\nNote: For API calls (transfers, queries), use fetch() with the network endpoints above.");
  console.log("The lite SDK focuses on cryptographic operations and serialization.");
}

main().catch(console.error);

