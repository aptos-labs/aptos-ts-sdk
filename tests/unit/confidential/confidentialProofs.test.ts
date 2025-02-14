import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/abstract/utils";
import {
  TwistedEd25519PrivateKey,
  ConfidentialKeyRotationSigmaProof,
  ConfidentialNormalizationSigmaProof,
  ConfidentialTransferSigmaProof,
  ConfidentialWithdrawSigmaProof,
  ConfidentialWithdraw,
  ConfidentialTransfer,
  ConfidentialKeyRotation,
  ConfidentialNormalization,
  RangeProofExecutor,
  ConfidentialAmount,
} from "../../../src";
import { toTwistedEd25519PrivateKey } from "../../../src/core/crypto/veiled/helpers";
import { generateRangeZKP, verifyRangeZKP } from "./wasmRangeProof";
import { preloadTables } from "./kangaroo/wasmPollardKangaroo";
import { ed25519modN } from "../../../src/core/crypto/utils";

/** !important: for testing purposes */
RangeProofExecutor.setGenerateRangeZKP(generateRangeZKP);
RangeProofExecutor.setVerifyRangeZKP(verifyRangeZKP);

const toValidHex = (outsideHex: string) =>
  bytesToHex(numberToBytesLE(ed25519modN(bytesToNumberLE(hexToBytes(outsideHex))), 32));

describe("Generate 'veiled coin' proofs", () => {
  it("Pre load wasm table map", async () => {
    await preloadTables();
  });

  const ALICE_BALANCE = 18446744073709551716n;

  const aliceVeiledDecryptionKey: TwistedEd25519PrivateKey = new TwistedEd25519PrivateKey(
    toValidHex("8f4bccf304a539586382e249b662790924aa7cb38effa824a4c88a420ffd3b08"),
  );
  const bobVeiledDecryptionKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();

  const aliceVeiledAmount = ConfidentialAmount.fromAmount(ALICE_BALANCE);
  aliceVeiledAmount.encrypt(aliceVeiledDecryptionKey.publicKey());

  const WITHDRAW_AMOUNT = 2n ** 16n;
  let veiledWithdraw: ConfidentialWithdraw;
  let veiledWithdrawSigmaProof: ConfidentialWithdrawSigmaProof;
  test("Generate withdraw sigma proof", async () => {
    veiledWithdraw = await ConfidentialWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(aliceVeiledDecryptionKey),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
    });

    veiledWithdrawSigmaProof = await veiledWithdraw.genSigmaProof();

    expect(veiledWithdrawSigmaProof).toBeDefined();
  });

  test("Verify withdraw sigma proof", async () => {
    const isValid = ConfidentialWithdraw.verifySigmaProof({
      publicKey: aliceVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: veiledWithdraw.encryptedActualBalanceAmount,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.confidentialAmountAfterWithdraw!.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
      sigmaProof: veiledWithdrawSigmaProof,
    });

    expect(isValid).toBeTruthy();
  });

  let veiledWithdrawRangeProof: Uint8Array[];
  test("Generate withdraw range proof", async () => {
    veiledWithdrawRangeProof = await veiledWithdraw.genRangeProof();
  });
  test("Verify withdraw range proof", async () => {
    const isValid = ConfidentialWithdraw.verifyRangeProof({
      rangeProof: veiledWithdrawRangeProof,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.confidentialAmountAfterWithdraw!.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });

  test("Should generate veiled withdraw authorization", async () => {
    const [{ sigmaProof, rangeProof }, vbNew] = await veiledWithdraw.authorizeWithdrawal();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(vbNew).toBeDefined();
  });

  test("Should generate and verify veiled withdraw with large amounts", async () => {
    const newAliceDecryptionKey = TwistedEd25519PrivateKey.generate();
    const newAliceBalance = ConfidentialAmount.fromAmount(2n ** 64n + 10n);
    newAliceBalance.encrypt(newAliceDecryptionKey.publicKey());

    const amountToWithdraw = 2n ** 16n + 10n - 10n;

    const largeVeiledWithdrawal = await ConfidentialWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(newAliceDecryptionKey),
      encryptedActualBalance: newAliceBalance.amountEncrypted!,
      amountToWithdraw,
    });

    const [{ sigmaProof, rangeProof }, vbNew] = await largeVeiledWithdrawal.authorizeWithdrawal();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(vbNew).toBeDefined();

    const isSigmaProofValid = ConfidentialWithdraw.verifySigmaProof({
      publicKey: newAliceDecryptionKey.publicKey(),
      encryptedActualBalance: largeVeiledWithdrawal.encryptedActualBalanceAmount,
      encryptedActualBalanceAfterWithdraw: largeVeiledWithdrawal.confidentialAmountAfterWithdraw.amountEncrypted!,
      amountToWithdraw,
      sigmaProof,
    });

    const isRangeProofValid = ConfidentialWithdraw.verifyRangeProof({
      rangeProof,
      encryptedActualBalanceAfterWithdraw: largeVeiledWithdrawal.confidentialAmountAfterWithdraw.amountEncrypted!,
    });

    expect(isSigmaProofValid).toBeTruthy();
    expect(isRangeProofValid).toBeTruthy();
  });

  const TRANSFER_AMOUNT = 10n;
  let veiledTransfer: ConfidentialTransfer;
  let veiledTransferSigmaProof: ConfidentialTransferSigmaProof;
  test("Generate transfer sigma proof", async () => {
    veiledTransfer = await ConfidentialTransfer.create({
      senderDecryptionKey: aliceVeiledDecryptionKey,
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      recipientEncryptionKey: bobVeiledDecryptionKey.publicKey(),
    });

    veiledTransferSigmaProof = await veiledTransfer.genSigmaProof();

    expect(veiledTransferSigmaProof).toBeDefined();
  });
  // const balanceAfterTransfer = ALICE_BALANCE - TRANSFER_AMOUNT;
  // // const encryptedBalanceAfterTransfer = amountToChunks(balanceAfterTransfer, VEILED_BALANCE_CHUNK_SIZE).map((el) =>
  // //   TwistedElGamal.encryptWithPK(el, aliceVeiledPrivateKey.publicKey()),
  // // );
  test("Verify transfer sigma proof", () => {
    const isValid = ConfidentialTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransfer.confidentialAmountAfterTransfer?.amountEncrypted!,
      encryptedTransferAmountByRecipient: veiledTransfer.encryptedAmountByRecipient,
      sigmaProof: veiledTransferSigmaProof,
    });

    expect(isValid).toBeTruthy();
  });

  let veiledTransferRangeProofs: {
    rangeProofAmount: Uint8Array[];
    rangeProofNewBalance: Uint8Array[];
  };
  test("Generate transfer range proofs", async () => {
    veiledTransferRangeProofs = await veiledTransfer.genRangeProof();
  });
  test("Verify transfer range proofs", async () => {
    const isValid = await ConfidentialTransfer.verifyRangeProof({
      encryptedAmountByRecipient: veiledTransfer.encryptedAmountByRecipient,
      encryptedActualBalanceAfterTransfer: veiledTransfer.confidentialAmountAfterTransfer!.amountEncrypted!,
      rangeProofAmount: veiledTransferRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const auditor = TwistedEd25519PrivateKey.generate();
  let veiledTransferWithAuditors: ConfidentialTransfer;
  let veiledTransferWithAuditorsSigmaProof: ConfidentialTransferSigmaProof;
  test("Generate transfer with auditors sigma proof", async () => {
    veiledTransferWithAuditors = await ConfidentialTransfer.create({
      senderDecryptionKey: aliceVeiledDecryptionKey,
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      amountToTransfer: TRANSFER_AMOUNT,
      recipientEncryptionKey: bobVeiledDecryptionKey.publicKey(),
      auditorEncryptionKeys: [auditor.publicKey()],
    });

    veiledTransferWithAuditorsSigmaProof = await veiledTransferWithAuditors.genSigmaProof();

    expect(veiledTransferWithAuditorsSigmaProof).toBeDefined();
  });
  test("Verify transfer with auditors sigma proof", () => {
    const isValid = ConfidentialTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.confidentialAmountAfterTransfer!.amountEncrypted!,
      encryptedTransferAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      sigmaProof: veiledTransferWithAuditorsSigmaProof,
      auditors: {
        publicKeys: [auditor.publicKey()],
        // decryptionKeys: veiledTransferWithAuditors.auditorsDList!,
        auditorsVBList: veiledTransferWithAuditors.auditorsVBList!,
      },
    });

    expect(isValid).toBeTruthy();
  });
  test("Should fail transfer sigma proof verification with wrong auditors", () => {
    const invalidAuditor = TwistedEd25519PrivateKey.generate();
    // const newRandomness = ed25519GenListOfRandom();
    // const auditorsDList = [invalidAuditor.publicKey()].map(publicKeyToU8).map((pk) => {
    //   const pkRist = RistrettoPoint.fromHex(pk);
    //   return newRandomness.map((r) => pkRist.multiply(r).toRawBytes());
    // });

    const isValid = ConfidentialTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.confidentialAmountAfterTransfer!.amountEncrypted!,
      encryptedTransferAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      sigmaProof: veiledTransferWithAuditorsSigmaProof,
      auditors: {
        publicKeys: [invalidAuditor.publicKey()],
        // decryptionKeys: auditorsDList,
        auditorsVBList: veiledTransferWithAuditors.auditorsVBList!,
      },
    });

    expect(isValid).toBeFalsy();
  });
  let veiledTransferWithAuditorsRangeProofs: {
    rangeProofAmount: Uint8Array[];
    rangeProofNewBalance: Uint8Array[];
  };
  test("Generate transfer with auditors range proofs", async () => {
    veiledTransferWithAuditorsRangeProofs = await veiledTransferWithAuditors.genRangeProof();

    expect(veiledTransferWithAuditorsRangeProofs).toBeDefined();
  });
  test("Verify transfer with auditors range proofs", async () => {
    const isValid = await ConfidentialTransfer.verifyRangeProof({
      encryptedAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.confidentialAmountAfterTransfer!.amountEncrypted!,
      rangeProofAmount: veiledTransferWithAuditorsRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferWithAuditorsRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const newAliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
  let veiledKeyRotation: ConfidentialKeyRotation;
  let veiledKeyRotationSigmaProof: ConfidentialKeyRotationSigmaProof;
  test("Generate key rotation sigma proof", async () => {
    veiledKeyRotation = await ConfidentialKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(aliceVeiledDecryptionKey),
      currEncryptedBalance: aliceVeiledAmount.amountEncrypted!,
      newDecryptionKey: toTwistedEd25519PrivateKey(newAliceVeiledPrivateKey),
    });

    veiledKeyRotationSigmaProof = await veiledKeyRotation.genSigmaProof();

    expect(veiledKeyRotationSigmaProof).toBeDefined();
  });
  test("Verify key rotation sigma proof", () => {
    const isValid = ConfidentialKeyRotation.verifySigmaProof({
      sigmaProof: veiledKeyRotationSigmaProof,
      currPublicKey: aliceVeiledDecryptionKey.publicKey(),
      newPublicKey: newAliceVeiledPrivateKey.publicKey(),
      currEncryptedBalance: aliceVeiledAmount.amountEncrypted!,
      newEncryptedBalance: veiledKeyRotation.newVeiledAmount.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });

  let veiledKeyRotationRangeProof: Uint8Array[];
  test("Generate key rotation range proof", async () => {
    veiledKeyRotationRangeProof = await veiledKeyRotation.genRangeProof();

    expect(veiledKeyRotationRangeProof).toBeDefined();
  });
  test("Verify key rotation range proof", async () => {
    const isValid = ConfidentialKeyRotation.verifyRangeProof({
      rangeProof: veiledKeyRotationRangeProof,
      newEncryptedBalance: veiledKeyRotation.newVeiledAmount!.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });

  test("Authorize Key Rotation", async () => {
    const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(newVB).toBeDefined();
  });

  const unnormalizedAliceVeiledAmount = ConfidentialAmount.fromChunks([
    ...Array.from({ length: ConfidentialAmount.CHUNKS_COUNT - 1 }, () => 2n ** ConfidentialAmount.CHUNK_BITS_BI + 100n),
    0n,
  ]);
  unnormalizedAliceVeiledAmount.encrypt(aliceVeiledDecryptionKey.publicKey());
  // const unnormalizedAliceBalanceChunks = [2n ** 32n + 100n, 2n ** 32n + 200n, 2n ** 32n + 300n, 0n];
  // const unnormalizedEncryptedBalanceAlice = unnormalizedAliceBalanceChunks.map((chunk) =>
  //   TwistedElGamal.encryptWithPK(chunk, aliceVeiledPrivateKey.publicKey()),
  // );
  let veiledNormalization: ConfidentialNormalization;
  let veiledNormalizationSigmaProof: ConfidentialNormalizationSigmaProof;
  test("Generate normalization sigma proof", async () => {
    veiledNormalization = await ConfidentialNormalization.create({
      decryptionKey: aliceVeiledDecryptionKey,
      unnormalizedEncryptedBalance: unnormalizedAliceVeiledAmount.amountEncrypted!,
      balanceAmount: unnormalizedAliceVeiledAmount.amount,
    });

    veiledNormalizationSigmaProof = await veiledNormalization.genSigmaProof();

    expect(veiledNormalizationSigmaProof).toBeDefined();
  });
  test("Verify normalization sigma proof", () => {
    const isValid = ConfidentialNormalization.verifySigmaProof({
      publicKey: aliceVeiledDecryptionKey.publicKey(),
      sigmaProof: veiledNormalizationSigmaProof,
      unnormalizedEncryptedBalance: unnormalizedAliceVeiledAmount.amountEncrypted!,
      normalizedEncryptedBalance: veiledNormalization.normalizedVeiledAmount!.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });
  let veiledNormalizationRangeProof: Uint8Array[];
  test("Generate normalization range proof", async () => {
    veiledNormalizationRangeProof = await veiledNormalization.genRangeProof();

    expect(veiledNormalizationRangeProof).toBeDefined();
  });
  test("Verify normalization range proof", async () => {
    const isValid = ConfidentialNormalization.verifyRangeProof({
      rangeProof: veiledNormalizationRangeProof,
      normalizedEncryptedBalance: veiledNormalization.normalizedVeiledAmount!.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });
});
