import {
  AVAILABLE_BALANCE_CHUNK_COUNT,
  CHUNK_BITS_BIG_INT,
  ChunkedAmount,
  ConfidentialKeyRotation,
  ConfidentialNormalization,
  ConfidentialTransfer,
  ConfidentialTransferRangeProof,
  ConfidentialWithdraw,
  EncryptedAmount,
  TwistedEd25519PrivateKey,
} from "../../src";
import type { SigmaProtocolProof } from "../../src/crypto/sigmaProtocol";
import { verifyWithdrawal } from "../../src/crypto/sigmaProtocolWithdraw";
import { verifyTransfer } from "../../src/crypto/sigmaProtocolTransfer";
import { longTestTimeout } from "../helpers";

describe("Generate 'confidential coin' proofs", () => {
  const ALICE_BALANCE = 18446744073709551716n;

  const aliceConfidentialDecryptionKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();
  const bobConfidentialDecryptionKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();

  const aliceConfidentialAmount = ChunkedAmount.fromAmount(ALICE_BALANCE);
  const aliceEncryptedBalance = new EncryptedAmount({
    chunkedAmount: aliceConfidentialAmount,
    publicKey: aliceConfidentialDecryptionKey.publicKey(),
  });
  const aliceEncryptedBalanceCipherText = aliceEncryptedBalance.getCipherText();

  // Use dummy addresses for the unit tests (32 bytes each)
  const dummySenderAddress = new Uint8Array(32);
  const dummyRecipientAddress = new Uint8Array(32).fill(0x0b);
  const dummyTokenAddress = new Uint8Array(32).fill(0x0a); // 0xa = APT metadata address

  const WITHDRAW_AMOUNT = 2n ** 16n;
  let confidentialWithdraw: ConfidentialWithdraw;
  let confidentialWithdrawSigmaProof: SigmaProtocolProof;
  test(
    "Generate withdraw sigma proof",
    async () => {
      confidentialWithdraw = await ConfidentialWithdraw.create({
        decryptionKey: aliceConfidentialDecryptionKey,
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: WITHDRAW_AMOUNT,
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
      });

      confidentialWithdrawSigmaProof = confidentialWithdraw.genSigmaProof();

      expect(confidentialWithdrawSigmaProof).toBeDefined();
      expect(confidentialWithdrawSigmaProof.commitment.length).toBeGreaterThan(0);
      expect(confidentialWithdrawSigmaProof.response.length).toBeGreaterThan(0);
    },
    longTestTimeout,
  );

  test(
    "Verify withdraw sigma proof",
    () => {
      const isValid = verifyWithdrawal({
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
        amount: WITHDRAW_AMOUNT,
        ekBytes: aliceConfidentialDecryptionKey.publicKey().toUint8Array(),
        oldBalanceC: confidentialWithdraw.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.C),
        oldBalanceD: confidentialWithdraw.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.D),
        newBalanceC: confidentialWithdraw.senderEncryptedAvailableBalanceAfterWithdrawal
          .getCipherText()
          .map((ct) => ct.C),
        newBalanceD: confidentialWithdraw.senderEncryptedAvailableBalanceAfterWithdrawal
          .getCipherText()
          .map((ct) => ct.D),
        proof: confidentialWithdrawSigmaProof,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  let confidentialWithdrawRangeProof: Uint8Array;
  test(
    "Generate withdraw range proof",
    async () => {
      confidentialWithdrawRangeProof = await confidentialWithdraw.genRangeProof();
    },
    longTestTimeout,
  );
  test(
    "Verify withdraw range proof",
    async () => {
      const isValid = ConfidentialWithdraw.verifyRangeProof({
        rangeProof: confidentialWithdrawRangeProof,
        senderEncryptedAvailableBalanceAfterWithdrawal:
          confidentialWithdraw.senderEncryptedAvailableBalanceAfterWithdrawal,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  const TRANSFER_AMOUNT = 10n;
  let confidentialTransfer: ConfidentialTransfer;
  let confidentialTransferSigmaProof: SigmaProtocolProof;
  test(
    "Generate transfer sigma proof",
    async () => {
      confidentialTransfer = await ConfidentialTransfer.create({
        senderDecryptionKey: aliceConfidentialDecryptionKey,
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: TRANSFER_AMOUNT,
        recipientEncryptionKey: bobConfidentialDecryptionKey.publicKey(),
        senderAddress: dummySenderAddress,
        recipientAddress: dummyRecipientAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
      });

      confidentialTransferSigmaProof = confidentialTransfer.genSigmaProof();

      expect(confidentialTransferSigmaProof).toBeDefined();
      expect(confidentialTransferSigmaProof.commitment.length).toBeGreaterThan(0);
      expect(confidentialTransferSigmaProof.response.length).toBeGreaterThan(0);
    },
    longTestTimeout,
  );

  test(
    "Verify transfer sigma proof",
    () => {
      const isValid = verifyTransfer({
        senderAddress: dummySenderAddress,
        recipientAddress: dummyRecipientAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
        ekSidBytes: aliceConfidentialDecryptionKey.publicKey().toUint8Array(),
        ekRidBytes: bobConfidentialDecryptionKey.publicKey().toUint8Array(),
        oldBalanceC: confidentialTransfer.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.C),
        oldBalanceD: confidentialTransfer.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.D),
        newBalanceC: confidentialTransfer.senderEncryptedAvailableBalanceAfterTransfer
          .getCipherText()
          .map((ct) => ct.C),
        newBalanceD: confidentialTransfer.senderEncryptedAvailableBalanceAfterTransfer
          .getCipherText()
          .map((ct) => ct.D),
        transferAmountC: confidentialTransfer.transferAmountEncryptedBySender.getCipherText().map((ct) => ct.C),
        transferAmountDSender: confidentialTransfer.transferAmountEncryptedBySender.getCipherText().map((ct) => ct.D),
        transferAmountDRecipient: confidentialTransfer.transferAmountEncryptedByRecipient
          .getCipherText()
          .map((ct) => ct.D),
        hasEffectiveAuditor: false,
        proof: confidentialTransferSigmaProof,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  let confidentialTransferRangeProofs: ConfidentialTransferRangeProof;
  test(
    "Generate transfer range proofs",
    async () => {
      confidentialTransferRangeProofs = await confidentialTransfer.genRangeProof();
    },
    longTestTimeout,
  );
  test(
    "Verify transfer range proofs",
    async () => {
      const isValid = await ConfidentialTransfer.verifyRangeProof({
        encryptedAmountByRecipient: confidentialTransfer.transferAmountEncryptedByRecipient,
        encryptedActualBalanceAfterTransfer: confidentialTransfer.senderEncryptedAvailableBalanceAfterTransfer,
        rangeProofAmount: confidentialTransferRangeProofs.rangeProofAmount,
        rangeProofNewBalance: confidentialTransferRangeProofs.rangeProofNewBalance,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  const auditor = TwistedEd25519PrivateKey.generate();
  let confidentialTransferWithAuditors: ConfidentialTransfer;
  let confidentialTransferWithAuditorsSigmaProof: SigmaProtocolProof;
  test(
    "Generate transfer with auditors sigma proof",
    async () => {
      confidentialTransferWithAuditors = await ConfidentialTransfer.create({
        senderDecryptionKey: aliceConfidentialDecryptionKey,
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: TRANSFER_AMOUNT,
        recipientEncryptionKey: bobConfidentialDecryptionKey.publicKey(),
        auditorEncryptionKeys: [auditor.publicKey()],
        senderAddress: dummySenderAddress,
        recipientAddress: dummyRecipientAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
      });

      confidentialTransferWithAuditorsSigmaProof = confidentialTransferWithAuditors.genSigmaProof();

      expect(confidentialTransferWithAuditorsSigmaProof).toBeDefined();
      expect(confidentialTransferWithAuditorsSigmaProof.commitment.length).toBeGreaterThan(0);
      expect(confidentialTransferWithAuditorsSigmaProof.response.length).toBeGreaterThan(0);
    },
    longTestTimeout,
  );
  test(
    "Verify transfer with auditors sigma proof",
    () => {
      // This test uses a voluntary auditor (not an on-chain effective auditor)
      const isValid = verifyTransfer({
        senderAddress: dummySenderAddress,
        recipientAddress: dummyRecipientAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
        ekSidBytes: aliceConfidentialDecryptionKey.publicKey().toUint8Array(),
        ekRidBytes: bobConfidentialDecryptionKey.publicKey().toUint8Array(),
        oldBalanceC: confidentialTransferWithAuditors.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.C),
        oldBalanceD: confidentialTransferWithAuditors.senderEncryptedAvailableBalance.getCipherText().map((ct) => ct.D),
        newBalanceC: confidentialTransferWithAuditors.senderEncryptedAvailableBalanceAfterTransfer
          .getCipherText()
          .map((ct) => ct.C),
        newBalanceD: confidentialTransferWithAuditors.senderEncryptedAvailableBalanceAfterTransfer
          .getCipherText()
          .map((ct) => ct.D),
        transferAmountC: confidentialTransferWithAuditors.transferAmountEncryptedBySender
          .getCipherText()
          .map((ct) => ct.C),
        transferAmountDSender: confidentialTransferWithAuditors.transferAmountEncryptedBySender
          .getCipherText()
          .map((ct) => ct.D),
        transferAmountDRecipient: confidentialTransferWithAuditors.transferAmountEncryptedByRecipient
          .getCipherText()
          .map((ct) => ct.D),
        hasEffectiveAuditor: false,
        auditorEkBytes: [auditor.publicKey().toUint8Array()],
        newBalanceDAud: confidentialTransferWithAuditors.auditorEncryptedBalancesAfterTransfer.map((ea) =>
          ea.getCipherText().map((ct) => ct.D),
        ),
        transferAmountDAud: confidentialTransferWithAuditors.transferAmountEncryptedByAuditors.map((ea) =>
          ea.getCipherText().map((ct) => ct.D),
        ),
        proof: confidentialTransferWithAuditorsSigmaProof,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );
  let confidentialTransferWithAuditorsRangeProofs: ConfidentialTransferRangeProof;
  test(
    "Generate transfer with auditors range proofs",
    async () => {
      confidentialTransferWithAuditorsRangeProofs = await confidentialTransferWithAuditors.genRangeProof();

      expect(confidentialTransferWithAuditorsRangeProofs).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify transfer with auditors range proofs",
    async () => {
      const isValid = await ConfidentialTransfer.verifyRangeProof({
        encryptedAmountByRecipient: confidentialTransferWithAuditors.transferAmountEncryptedByRecipient,
        encryptedActualBalanceAfterTransfer:
          confidentialTransferWithAuditors.senderEncryptedAvailableBalanceAfterTransfer,
        rangeProofAmount: confidentialTransferWithAuditorsRangeProofs.rangeProofAmount,
        rangeProofNewBalance: confidentialTransferWithAuditorsRangeProofs.rangeProofNewBalance,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  const newAliceConfidentialPrivateKey = TwistedEd25519PrivateKey.generate();

  let keyRotationProofResult: ReturnType<ConfidentialKeyRotation["authorizeKeyRotation"]>;

  test(
    "Generate key rotation sigma proof",
    () => {
      const confidentialKeyRotation = ConfidentialKeyRotation.create({
        senderDecryptionKey: aliceConfidentialDecryptionKey,
        currentEncryptedAvailableBalance: aliceEncryptedBalance,
        newSenderDecryptionKey: newAliceConfidentialPrivateKey,
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
      });

      keyRotationProofResult = confidentialKeyRotation.authorizeKeyRotation();

      const { newEkBytes, newDBytes, proof } = keyRotationProofResult;

      // Verify the proof structure
      expect(newEkBytes).toBeDefined();
      expect(newEkBytes.length).toBe(32);
      expect(newDBytes).toBeDefined();
      expect(newDBytes.length).toBe(AVAILABLE_BALANCE_CHUNK_COUNT);
      newDBytes.forEach((d: Uint8Array) => expect(d.length).toBe(32));
      // Commitment has 3 + numChunks points (psi output size)
      expect(proof.commitment.length).toBe(3 + AVAILABLE_BALANCE_CHUNK_COUNT);
      proof.commitment.forEach((c: Uint8Array) => expect(c.length).toBe(32));
      // Response has 3 scalars (dk, delta, delta_inv)
      expect(proof.response.length).toBe(3);
      proof.response.forEach((r: Uint8Array) => expect(r.length).toBe(32));
    },
    longTestTimeout,
  );

  test(
    "Verify key rotation sigma proof",
    () => {
      const { newEkBytes, newDBytes, proof } = keyRotationProofResult;

      const isValid = ConfidentialKeyRotation.verify({
        oldEk: aliceConfidentialDecryptionKey.publicKey().toUint8Array(),
        newEk: newEkBytes,
        oldD: aliceEncryptedBalanceCipherText.map((ct) => ct.D.toBytes()),
        newD: newDBytes,
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
        proof,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  const unnormalizedAliceConfidentialAmount = ChunkedAmount.fromChunks([
    ...Array.from({ length: AVAILABLE_BALANCE_CHUNK_COUNT - 1 }, () => 2n ** CHUNK_BITS_BIG_INT + 100n),
    0n,
  ]);
  const unnormalizedEncryptedBalance = new EncryptedAmount({
    chunkedAmount: unnormalizedAliceConfidentialAmount,
    publicKey: aliceConfidentialDecryptionKey.publicKey(),
  });

  let confidentialNormalization: ConfidentialNormalization;
  let confidentialNormalizationSigmaProof: SigmaProtocolProof;
  test(
    "Generate normalization sigma proof",
    async () => {
      confidentialNormalization = await ConfidentialNormalization.create({
        decryptionKey: aliceConfidentialDecryptionKey,
        unnormalizedAvailableBalance: unnormalizedEncryptedBalance,
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
      });

      confidentialNormalizationSigmaProof = confidentialNormalization.genSigmaProof();

      expect(confidentialNormalizationSigmaProof).toBeDefined();
      expect(confidentialNormalizationSigmaProof.commitment.length).toBeGreaterThan(0);
      expect(confidentialNormalizationSigmaProof.response.length).toBeGreaterThan(0);
    },
    longTestTimeout,
  );
  test(
    "Verify normalization sigma proof",
    () => {
      const isValid = verifyWithdrawal({
        senderAddress: dummySenderAddress,
        tokenAddress: dummyTokenAddress,
        chainId: 4,
        amount: 0n,
        ekBytes: aliceConfidentialDecryptionKey.publicKey().toUint8Array(),
        oldBalanceC: confidentialNormalization.unnormalizedEncryptedAvailableBalance.getCipherText().map((ct) => ct.C),
        oldBalanceD: confidentialNormalization.unnormalizedEncryptedAvailableBalance.getCipherText().map((ct) => ct.D),
        newBalanceC: confidentialNormalization.normalizedEncryptedAvailableBalance.getCipherText().map((ct) => ct.C),
        newBalanceD: confidentialNormalization.normalizedEncryptedAvailableBalance.getCipherText().map((ct) => ct.D),
        proof: confidentialNormalizationSigmaProof,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );
  let confidentialNormalizationRangeProof: Uint8Array;
  test(
    "Generate normalization range proof",
    async () => {
      confidentialNormalizationRangeProof = await confidentialNormalization.genRangeProof();

      expect(confidentialNormalizationRangeProof).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify normalization range proof",
    async () => {
      const isValid = ConfidentialNormalization.verifyRangeProof({
        rangeProof: confidentialNormalizationRangeProof,
        normalizedEncryptedBalance: confidentialNormalization.normalizedEncryptedAvailableBalance,
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );
});
