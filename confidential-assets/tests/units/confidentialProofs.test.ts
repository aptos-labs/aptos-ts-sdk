import {
  ChunkedAmount,
  ConfidentialKeyRotation,
  ConfidentialKeyRotationSigmaProof,
  ConfidentialNormalization,
  ConfidentialNormalizationSigmaProof,
  ConfidentialTransfer,
  ConfidentialTransferRangeProof,
  ConfidentialTransferSigmaProof,
  ConfidentialWithdraw,
  ConfidentialWithdrawSigmaProof,
  toTwistedEd25519PrivateKey,
  TwistedEd25519PrivateKey,
} from "../../src";
import { preloadTables } from "../helpers/wasmPollardKangaroo";
import { longTestTimeout } from "../helpers";
import { EncryptedAmount } from "../../src/encryptedAmount";

describe("Generate 'confidential coin' proofs", () => {
  it(
    "Pre load wasm table map",
    async () => {
      await preloadTables();
    },
    longTestTimeout,
  );

  const ALICE_BALANCE = 18446744073709551716n;

  const aliceConfidentialDecryptionKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();
  const bobConfidentialDecryptionKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();

  const aliceConfidentialAmount = ChunkedAmount.fromAmount(ALICE_BALANCE);
  const aliceEncryptedBalanceCipherText = new EncryptedAmount({
    chunkedAmount: aliceConfidentialAmount,
    publicKey: aliceConfidentialDecryptionKey.publicKey(),
  }).getCipherText();

  const WITHDRAW_AMOUNT = 2n ** 16n;
  let confidentialWithdraw: ConfidentialWithdraw;
  let confidentialWithdrawSigmaProof: ConfidentialWithdrawSigmaProof;
  test(
    "Generate withdraw sigma proof",
    async () => {
      confidentialWithdraw = await ConfidentialWithdraw.create({
        decryptionKey: toTwistedEd25519PrivateKey(aliceConfidentialDecryptionKey),
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: WITHDRAW_AMOUNT,
      });

      confidentialWithdrawSigmaProof = await confidentialWithdraw.genSigmaProof();

      expect(confidentialWithdrawSigmaProof).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "Verify withdraw sigma proof",
    async () => {
      const isValid = ConfidentialWithdraw.verifySigmaProof({
        senderEncryptedAvailableBalance: confidentialWithdraw.senderEncryptedAvailableBalance,
        senderEncryptedAvailableBalanceAfterWithdrawal:
          confidentialWithdraw.senderEncryptedAvailableBalanceAfterWithdrawal,
        amountToWithdraw: WITHDRAW_AMOUNT,
        sigmaProof: confidentialWithdrawSigmaProof,
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
  let confidentialTransferSigmaProof: ConfidentialTransferSigmaProof;
  test(
    "Generate transfer sigma proof",
    async () => {
      confidentialTransfer = await ConfidentialTransfer.create({
        senderDecryptionKey: aliceConfidentialDecryptionKey,
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: TRANSFER_AMOUNT,
        recipientEncryptionKey: bobConfidentialDecryptionKey.publicKey(),
      });

      confidentialTransferSigmaProof = await confidentialTransfer.genSigmaProof();

      expect(confidentialTransferSigmaProof).toBeDefined();
    },
    longTestTimeout,
  );

  test(
    "Verify transfer sigma proof",
    () => {
      const isValid = ConfidentialTransfer.verifySigmaProof({
        senderPrivateKey: aliceConfidentialDecryptionKey,
        recipientPublicKey: bobConfidentialDecryptionKey.publicKey(),
        encryptedActualBalance: aliceEncryptedBalanceCipherText,
        encryptedTransferAmountBySender: confidentialTransfer.transferAmountEncryptedBySender,
        encryptedActualBalanceAfterTransfer: confidentialTransfer.senderEncryptedAvailableBalanceAfterTransfer,
        encryptedTransferAmountByRecipient: confidentialTransfer.transferAmountEncryptedByRecipient,
        sigmaProof: confidentialTransferSigmaProof,
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
  let confidentialTransferWithAuditorsSigmaProof: ConfidentialTransferSigmaProof;
  test(
    "Generate transfer with auditors sigma proof",
    async () => {
      confidentialTransferWithAuditors = await ConfidentialTransfer.create({
        senderDecryptionKey: aliceConfidentialDecryptionKey,
        senderAvailableBalanceCipherText: aliceEncryptedBalanceCipherText,
        amount: TRANSFER_AMOUNT,
        recipientEncryptionKey: bobConfidentialDecryptionKey.publicKey(),
        auditorEncryptionKeys: [auditor.publicKey()],
      });

      confidentialTransferWithAuditorsSigmaProof = await confidentialTransferWithAuditors.genSigmaProof();

      expect(confidentialTransferWithAuditorsSigmaProof).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify transfer with auditors sigma proof",
    () => {
      const isValid = ConfidentialTransfer.verifySigmaProof({
        senderPrivateKey: aliceConfidentialDecryptionKey,
        recipientPublicKey: bobConfidentialDecryptionKey.publicKey(),
        encryptedActualBalance: aliceEncryptedBalanceCipherText,
        encryptedActualBalanceAfterTransfer:
          confidentialTransferWithAuditors.senderEncryptedAvailableBalanceAfterTransfer,
        encryptedTransferAmountByRecipient: confidentialTransferWithAuditors.transferAmountEncryptedByRecipient,
        encryptedTransferAmountBySender: confidentialTransferWithAuditors.transferAmountEncryptedBySender,
        sigmaProof: confidentialTransferWithAuditorsSigmaProof,
        auditors: {
          publicKeys: [auditor.publicKey()],
          auditorsCBList: confidentialTransferWithAuditors.transferAmountEncryptedByAuditors!.map(
            (el) => el.getCipherText(),
          ),
        },
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );
  test(
    "Should fail transfer sigma proof verification with wrong auditors",
    () => {
      const invalidAuditor = TwistedEd25519PrivateKey.generate();

      const isValid = ConfidentialTransfer.verifySigmaProof({
        senderPrivateKey: aliceConfidentialDecryptionKey,
        recipientPublicKey: bobConfidentialDecryptionKey.publicKey(),
        encryptedActualBalance: aliceEncryptedBalanceCipherText,
        encryptedActualBalanceAfterTransfer:
          confidentialTransferWithAuditors.senderEncryptedAvailableBalanceAfterTransfer,
        encryptedTransferAmountByRecipient: confidentialTransferWithAuditors.transferAmountEncryptedByRecipient,
        encryptedTransferAmountBySender: confidentialTransferWithAuditors.transferAmountEncryptedBySender,
        sigmaProof: confidentialTransferWithAuditorsSigmaProof,
        auditors: {
          publicKeys: [invalidAuditor.publicKey()],
          auditorsCBList: confidentialTransferWithAuditors.transferAmountEncryptedByAuditors!.map(
            (el) => el.getCipherText(),
          ),
        },
      });

      expect(isValid).toBeFalsy();
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
  let confidentialKeyRotation: ConfidentialKeyRotation;
  let confidentialKeyRotationSigmaProof: ConfidentialKeyRotationSigmaProof;
  test(
    "Generate key rotation sigma proof",
    async () => {
      confidentialKeyRotation = await ConfidentialKeyRotation.create({
        currDecryptionKey: aliceConfidentialDecryptionKey,
        currEncryptedBalance: aliceEncryptedBalanceCipherText,
        newDecryptionKey: newAliceConfidentialPrivateKey,
      });

      confidentialKeyRotationSigmaProof = await confidentialKeyRotation.genSigmaProof();

      expect(confidentialKeyRotationSigmaProof).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify key rotation sigma proof",
    () => {
      const isValid = ConfidentialKeyRotation.verifySigmaProof({
        sigmaProof: confidentialKeyRotationSigmaProof,
        currPublicKey: aliceConfidentialDecryptionKey.publicKey(),
        newPublicKey: newAliceConfidentialPrivateKey.publicKey(),
        currEncryptedBalance: aliceEncryptedBalanceCipherText,
        newEncryptedBalance: confidentialKeyRotation.newEncryptedAvailableBalance.getCipherText(),
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  let confidentialKeyRotationRangeProof: Uint8Array;
  test(
    "Generate key rotation range proof",
    async () => {
      confidentialKeyRotationRangeProof = await confidentialKeyRotation.genRangeProof();

      expect(confidentialKeyRotationRangeProof).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify key rotation range proof",
    async () => {
      const isValid = ConfidentialKeyRotation.verifyRangeProof({
        rangeProof: confidentialKeyRotationRangeProof,
        newEncryptedBalance: confidentialKeyRotation.newEncryptedAvailableBalance.getCipherText(),
      });

      expect(isValid).toBeTruthy();
    },
    longTestTimeout,
  );

  test(
    "Authorize Key Rotation",
    async () => {
      const [{ sigmaProof, rangeProof }, newVB] = await confidentialKeyRotation.authorizeKeyRotation();

      expect(sigmaProof).toBeDefined();
      expect(rangeProof).toBeDefined();
      expect(newVB).toBeDefined();
    },
    longTestTimeout,
  );

  const unnormalizedAliceConfidentialAmount = ChunkedAmount.fromChunks([
    ...Array.from({ length: ChunkedAmount.CHUNKS_COUNT - 1 }, () => 2n ** ChunkedAmount.CHUNK_BITS_BIG_INT + 100n),
    0n,
  ]);
  const unnormalizedEncryptedBalance = new EncryptedAmount({
    chunkedAmount: unnormalizedAliceConfidentialAmount,
    publicKey: aliceConfidentialDecryptionKey.publicKey(),
  });

  let confidentialNormalization: ConfidentialNormalization;
  let confidentialNormalizationSigmaProof: ConfidentialNormalizationSigmaProof;
  test(
    "Generate normalization sigma proof",
    async () => {
      confidentialNormalization = await ConfidentialNormalization.create({
        decryptionKey: aliceConfidentialDecryptionKey,
        unnormalizedAvailableBalanceCipherText: unnormalizedEncryptedBalance.getCipherText(),
      });

      confidentialNormalizationSigmaProof = await confidentialNormalization.genSigmaProof();

      expect(confidentialNormalizationSigmaProof).toBeDefined();
    },
    longTestTimeout,
  );
  test(
    "Verify normalization sigma proof",
    () => {
      const isValid = ConfidentialNormalization.verifySigmaProof({
        publicKey: aliceConfidentialDecryptionKey.publicKey(),
        sigmaProof: confidentialNormalizationSigmaProof,
        unnormalizedEncryptedBalance: confidentialNormalization.unnormalizedEncryptedAvailableBalance,
        normalizedEncryptedBalance: confidentialNormalization.normalizedEncryptedAvailableBalance,
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
