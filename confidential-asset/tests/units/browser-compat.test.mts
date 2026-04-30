/**
 * Browser compatibility tests.
 *
 * These tests verify that core cryptographic operations work correctly in a
 * browser-like environment (happy-dom). They intentionally avoid Node.js-only
 * APIs (e.g. `import crypto from "crypto"`) and use only Web-standard globals
 * so that failures here indicate real browser incompatibilities.
 *
 * Run against the browser config:
 *   pnpm test:browser
 *
 * Run against the default Node config to confirm the same tests pass in Node:
 *   pnpm test tests/units/browser-compat.test.ts
 */

import {
  TwistedEd25519PrivateKey,
  TwistedElGamal,
  EncryptedAmount,
  ChunkedAmount,
  ConfidentialWithdraw,
  ConfidentialTransfer,
} from "../../src/index.js";

// Intentionally not importing from ../helpers — that module depends on
// Node.js-only APIs (child_process, fs) which are unavailable in browsers.
const longTestTimeout = 120_000;

// ---------------------------------------------------------------------------
// Helpers — browser-safe (uses globalThis.crypto, not Node's crypto module)
// ---------------------------------------------------------------------------

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

function randomBigInt(bits: number): bigint {
  if (bits <= 0) return 0n;
  const bytes = Math.ceil(bits / 8);
  const buf = randomBytes(bytes);
  let result = 0n;
  for (const byte of buf) result = (result << 8n) | BigInt(byte);
  return result & ((1n << BigInt(bits)) - 1n);
}

// ---------------------------------------------------------------------------
// Environment checks
// ---------------------------------------------------------------------------

describe("Environment globals", () => {
  it("globalThis.crypto is available", () => {
    expect(globalThis.crypto).toBeDefined();
  });

  it("globalThis.crypto.getRandomValues works", () => {
    const buf = new Uint8Array(32);
    globalThis.crypto.getRandomValues(buf);
    // Statistically, a 32-byte buffer of all zeros from a CSPRNG is impossible
    expect(buf.some((b) => b !== 0)).toBe(true);
  });

  it("performance.now is available", () => {
    expect(typeof performance.now).toBe("function");
    expect(performance.now()).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

describe("TwistedEd25519PrivateKey", () => {
  it("generate() produces a valid key pair", () => {
    const key = TwistedEd25519PrivateKey.generate();
    expect(key).toBeDefined();

    const pub = key.publicKey();
    expect(pub).toBeDefined();
    expect(pub.toUint8Array()).toHaveLength(32);
  });

  it("two generated keys are distinct", () => {
    const a = TwistedEd25519PrivateKey.generate();
    const b = TwistedEd25519PrivateKey.generate();
    expect(a.publicKey().toUint8Array()).not.toEqual(b.publicKey().toUint8Array());
  });
});

// ---------------------------------------------------------------------------
// Twisted ElGamal encrypt / decrypt round-trip (uses WASM discrete-log solver)
// ---------------------------------------------------------------------------

describe("TwistedElGamal encrypt/decrypt", () => {
  it(
    "round-trips a 16-bit value",
    async () => {
      const x = randomBigInt(16);
      const key = TwistedEd25519PrivateKey.generate();
      const ciphertext = TwistedElGamal.encryptWithPK(x, key.publicKey());
      const decrypted = await TwistedElGamal.decryptWithPK(ciphertext, key);
      expect(decrypted).toBe(x);
    },
    longTestTimeout,
  );

  it(
    "round-trips zero",
    async () => {
      const key = TwistedEd25519PrivateKey.generate();
      const ciphertext = TwistedElGamal.encryptWithPK(0n, key.publicKey());
      const decrypted = await TwistedElGamal.decryptWithPK(ciphertext, key);
      expect(decrypted).toBe(0n);
    },
    longTestTimeout,
  );
});

// ---------------------------------------------------------------------------
// EncryptedAmount / ChunkedAmount
// ---------------------------------------------------------------------------

describe("EncryptedAmount", () => {
  it("encrypts a chunked balance and produces ciphertext", () => {
    const key = TwistedEd25519PrivateKey.generate();
    const amount = ChunkedAmount.fromAmount(1000n);
    const encrypted = new EncryptedAmount({ chunkedAmount: amount, publicKey: key.publicKey() });
    const ct = encrypted.getCipherText();

    expect(ct.length).toBeGreaterThan(0);
    for (const chunk of ct) {
      expect(chunk.C).toBeDefined();
      expect(chunk.D).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Withdraw proof (exercises WASM range proof + sigma proof)
// ---------------------------------------------------------------------------

describe(
  "ConfidentialWithdraw proofs",
  () => {
    const BALANCE = 1_000_000n;
    const AMOUNT = 100n;

    // Use dummy addresses — we are not hitting the chain
    const senderAddress = randomBytes(32);
    const tokenAddress = randomBytes(32);

    let key: TwistedEd25519PrivateKey;
    let withdraw: ConfidentialWithdraw;

    beforeAll(async () => {
      key = TwistedEd25519PrivateKey.generate();
      const chunked = ChunkedAmount.fromAmount(BALANCE);
      const encryptedBalance = new EncryptedAmount({ chunkedAmount: chunked, publicKey: key.publicKey() });

      withdraw = await ConfidentialWithdraw.create({
        decryptionKey: key,
        senderAvailableBalanceCipherText: encryptedBalance.getCipherText(),
        amount: AMOUNT,
        senderAddress,
        tokenAddress,
        chainId: 4,
      });
    });

    it("generates a sigma proof", () => {
      const proof = withdraw.genSigmaProof();
      expect(proof.commitment.length).toBeGreaterThan(0);
      expect(proof.response.length).toBeGreaterThan(0);
    });

    it("generates a range proof", async () => {
      const rangeProof = await withdraw.genRangeProof();
      expect(rangeProof).toBeDefined();
      expect(rangeProof.length).toBeGreaterThan(0);
    });

    it("verifies the range proof", async () => {
      const rangeProof = await withdraw.genRangeProof();
      const valid = ConfidentialWithdraw.verifyRangeProof({
        rangeProof,
        senderEncryptedAvailableBalanceAfterWithdrawal: withdraw.senderEncryptedAvailableBalanceAfterWithdrawal,
      });
      expect(valid).toBeTruthy();
    });
  },
  longTestTimeout,
);

// ---------------------------------------------------------------------------
// Transfer proof (exercises WASM range proof + sigma proof, two parties)
// ---------------------------------------------------------------------------

describe(
  "ConfidentialTransfer proofs",
  () => {
    const BALANCE = 500_000n;
    const AMOUNT = 50n;

    const senderAddress = randomBytes(32);
    const recipientAddress = randomBytes(32);
    const tokenAddress = randomBytes(32);

    let senderKey: TwistedEd25519PrivateKey;
    let recipientKey: TwistedEd25519PrivateKey;
    let transfer: ConfidentialTransfer;

    beforeAll(async () => {
      senderKey = TwistedEd25519PrivateKey.generate();
      recipientKey = TwistedEd25519PrivateKey.generate();

      const chunked = ChunkedAmount.fromAmount(BALANCE);
      const encryptedBalance = new EncryptedAmount({ chunkedAmount: chunked, publicKey: senderKey.publicKey() });

      transfer = await ConfidentialTransfer.create({
        senderDecryptionKey: senderKey,
        senderAvailableBalanceCipherText: encryptedBalance.getCipherText(),
        amount: AMOUNT,
        recipientEncryptionKey: recipientKey.publicKey(),
        senderAddress,
        recipientAddress,
        tokenAddress,
        chainId: 4,
      });
    });

    it("generates a sigma proof", () => {
      const proof = transfer.genSigmaProof();
      expect(proof.commitment.length).toBeGreaterThan(0);
      expect(proof.response.length).toBeGreaterThan(0);
    });

    it("generates and verifies range proofs", async () => {
      const { rangeProofAmount, rangeProofNewBalance } = await transfer.genRangeProof();
      const valid = await ConfidentialTransfer.verifyRangeProof({
        encryptedAmountByRecipient: transfer.transferAmountEncryptedByRecipient,
        encryptedActualBalanceAfterTransfer: transfer.senderEncryptedAvailableBalanceAfterTransfer,
        rangeProofAmount,
        rangeProofNewBalance,
      });
      expect(valid).toBeTruthy();
    });
  },
  longTestTimeout,
);
