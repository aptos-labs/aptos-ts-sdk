import {
  TwistedEd25519PrivateKey,
  VeiledKeyRotationSigmaProof,
  VeiledNormalizationSigmaProof,
  VeiledTransferSigmaProof,
  VeiledWithdrawSigmaProof,
  VeiledWithdraw,
  VeiledTransfer,
  VeiledKeyRotation,
  VeiledNormalization,
} from "../../src";
import { toTwistedEd25519PrivateKey } from "../../src/core/crypto/veiled/helpers";
import { VeiledAmount } from "../../src/core/crypto/veiled/veiledAmount";

describe("Generate 'veiled coin' proofs", () => {
  const ALICE_BALANCE = 70n;

  const aliceVeiledPrivateKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();
  const bobVeiledPrivateKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();

  const aliceVeiledAmount = VeiledAmount.fromAmount(ALICE_BALANCE);
  aliceVeiledAmount.encryptBalance(aliceVeiledPrivateKey.publicKey());

  const WITHDRAW_AMOUNT = 15n;
  let veiledWithdraw: VeiledWithdraw;
  let veiledWithdrawSigmaProof: VeiledWithdrawSigmaProof;
  test("Generate withdraw sigma proof", async () => {
    veiledWithdraw = await VeiledWithdraw.create({
      privateKey: toTwistedEd25519PrivateKey(aliceVeiledPrivateKey),
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      amountToWithdraw: WITHDRAW_AMOUNT,
    });

    veiledWithdrawSigmaProof = await veiledWithdraw.genSigmaProof();

    expect(veiledWithdrawSigmaProof).toBeDefined();
  });

  test("Verify withdraw sigma proof", async () => {
    const isValid = VeiledWithdraw.verifySigmaProof({
      publicKey: aliceVeiledPrivateKey.publicKey(),
      encryptedActualBalance: veiledWithdraw.encryptedActualBalanceAmount,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.veiledAmountAfterWithdraw!.encryptedAmount!,
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
    const isValid = VeiledWithdraw.verifyRangeProof({
      rangeProof: veiledWithdrawRangeProof,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.veiledAmountAfterWithdraw!.encryptedAmount!,
    });

    expect(isValid).toBeTruthy();
  });

  test("Should generate veiled withdraw authorization", async () => {
    const [{ sigmaProof, rangeProof }, vbNew] = await veiledWithdraw.authorizeWithdrawal();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(vbNew).toBeDefined();
  });

  const TRANSFER_AMOUNT = 10n;
  let veiledTransfer: VeiledTransfer;
  let veiledTransferSigmaProof: VeiledTransferSigmaProof;
  test("Generate transfer sigma proof", async () => {
    veiledTransfer = await VeiledTransfer.create({
      senderPrivateKey: aliceVeiledPrivateKey,
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      amountToTransfer: TRANSFER_AMOUNT,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
    });

    veiledTransferSigmaProof = await veiledTransfer.genSigmaProof();

    expect(veiledTransferSigmaProof).toBeDefined();
  });
  // const balanceAfterTransfer = ALICE_BALANCE - TRANSFER_AMOUNT;
  // // const encryptedBalanceAfterTransfer = amountToChunks(balanceAfterTransfer, VEILED_BALANCE_CHUNK_SIZE).map((el) =>
  // //   TwistedElGamal.encryptWithPK(el, aliceVeiledPrivateKey.publicKey()),
  // // );
  test("Verify transfer sigma proof", () => {
    const isValid = VeiledTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      encryptedActualBalanceAfterTransfer: veiledTransfer.veiledAmountAfterTransfer?.encryptedAmount!,
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
    const isValid = await VeiledTransfer.verifyRangeProof({
      encryptedAmountByRecipient: veiledTransfer.encryptedAmountByRecipient,
      encryptedActualBalanceAfterTransfer: veiledTransfer.veiledAmountAfterTransfer!.encryptedAmount!,
      rangeProofAmount: veiledTransferRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const auditor = TwistedEd25519PrivateKey.generate();
  let veiledTransferWithAuditors: VeiledTransfer;
  let veiledTransferWithAuditorsSigmaProof: VeiledTransferSigmaProof;
  test("Generate transfer with auditors sigma proof", async () => {
    veiledTransferWithAuditors = await VeiledTransfer.create({
      senderPrivateKey: aliceVeiledPrivateKey,
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      amountToTransfer: TRANSFER_AMOUNT,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      auditorPublicKeys: [auditor.publicKey()],
    });

    veiledTransferWithAuditorsSigmaProof = await veiledTransferWithAuditors.genSigmaProof();

    expect(veiledTransferWithAuditorsSigmaProof).toBeDefined();
  });
  test("Verify transfer with auditors sigma proof", () => {
    const isValid = VeiledTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.encryptedAmount!,
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

    const isValid = VeiledTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.encryptedAmount!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.encryptedAmount!,
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
    const isValid = await VeiledTransfer.verifyRangeProof({
      encryptedAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.encryptedAmount!,
      rangeProofAmount: veiledTransferWithAuditorsRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferWithAuditorsRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const newAliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
  const veiledKeyRotation = new VeiledKeyRotation(
    aliceVeiledPrivateKey,
    newAliceVeiledPrivateKey,
    aliceVeiledAmount.encryptedAmount!,
  );
  let veiledKeyRotationSigmaProof: VeiledKeyRotationSigmaProof;
  test("Generate key rotation sigma proof", async () => {
    await veiledKeyRotation.init();

    veiledKeyRotationSigmaProof = await veiledKeyRotation.genSigmaProof();

    expect(veiledKeyRotationSigmaProof).toBeDefined();
  });
  test("Verify key rotation sigma proof", () => {
    const isValid = VeiledKeyRotation.verifySigmaProof({
      sigmaProof: veiledKeyRotationSigmaProof,
      currPublicKey: aliceVeiledPrivateKey.publicKey(),
      newPublicKey: newAliceVeiledPrivateKey.publicKey(),
      currEncryptedBalance: aliceVeiledAmount.encryptedAmount!,
      newEncryptedBalance: veiledKeyRotation.newVeiledAmount!.encryptedAmount!,
    });

    expect(isValid).toBeTruthy();
  });

  let veiledKeyRotationRangeProof: Uint8Array[];
  test("Generate key rotation range proof", async () => {
    veiledKeyRotationRangeProof = await veiledKeyRotation.genRangeProof();

    expect(veiledKeyRotationRangeProof).toBeDefined();
  });
  test("Verify key rotation range proof", async () => {
    const isValid = VeiledKeyRotation.verifyRangeProof({
      rangeProof: veiledKeyRotationRangeProof,
      newEncryptedBalance: veiledKeyRotation.newVeiledAmount!.encryptedAmount!,
    });

    expect(isValid).toBeTruthy();
  });

  test("Authorize Key Rotation", async () => {
    const [{ sigmaProof, rangeProof }, newVB] = await veiledKeyRotation.authorizeKeyRotation();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(newVB).toBeDefined();
  });

  const unnormalizedAliceVeiledAmount = VeiledAmount.fromChunks([
    2n ** 32n + 100n,
    2n ** 32n + 200n,
    2n ** 32n + 300n,
    0n,
  ]);
  unnormalizedAliceVeiledAmount.encryptBalance(aliceVeiledPrivateKey.publicKey());
  // const unnormalizedAliceBalanceChunks = [2n ** 32n + 100n, 2n ** 32n + 200n, 2n ** 32n + 300n, 0n];
  // const unnormalizedEncryptedBalanceAlice = unnormalizedAliceBalanceChunks.map((chunk) =>
  //   TwistedElGamal.encryptWithPK(chunk, aliceVeiledPrivateKey.publicKey()),
  // );
  const veiledNormalization = new VeiledNormalization(
    aliceVeiledPrivateKey,
    unnormalizedAliceVeiledAmount.encryptedAmount!,
    unnormalizedAliceVeiledAmount.amount,
  );
  let veiledNormalizationSigmaProof: VeiledNormalizationSigmaProof;
  test("Generate normalization sigma proof", async () => {
    await veiledNormalization.init();

    veiledNormalizationSigmaProof = await veiledNormalization.genSigmaProof();

    expect(veiledNormalizationSigmaProof).toBeDefined();
  });
  test("Verify normalization sigma proof", () => {
    const isValid = VeiledNormalization.verifySigmaProof({
      publicKey: aliceVeiledPrivateKey.publicKey(),
      sigmaProof: veiledNormalizationSigmaProof,
      unnormilizedEncryptedBalance: unnormalizedAliceVeiledAmount.encryptedAmount!,
      normalizedEncryptedBalance: veiledNormalization.normalizedVeiledAmount!.encryptedAmount!,
    });

    expect(isValid).toBeTruthy();
  });
  let veiledNormalizationRangeProof: Uint8Array[];
  test("Generate normalization range proof", async () => {
    veiledNormalizationRangeProof = await veiledNormalization.genRangeProof();

    expect(veiledNormalizationRangeProof).toBeDefined();
  });
  test("Verify normalization range proof", async () => {
    const isValid = VeiledNormalization.verifyRangeProof({
      rangeProof: veiledNormalizationRangeProof,
      normalizedEncryptedBalance: veiledNormalization.normalizedVeiledAmount!.encryptedAmount!,
    });

    expect(isValid).toBeTruthy();
  });
});
