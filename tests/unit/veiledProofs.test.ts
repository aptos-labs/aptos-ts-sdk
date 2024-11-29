import { RistrettoPoint } from "@noble/curves/ed25519";
import {
  amountToChunks,
  TwistedEd25519PrivateKey,
  TwistedElGamal,
  VeiledKeyRotationSigmaProof,
  VeiledNormalizationSigmaProof,
  VeiledTransferSigmaProof,
  VeiledWithdrawSigmaProof,
  VeiledWithdraw,
  VeiledTransfer,
  VeiledKeyRotation,
  VeiledNormalization,
  chunksToAmount,
} from "../../src";
import { publicKeyToU8, toTwistedEd25519PrivateKey } from "../../src/core/crypto/veiled/helpers";
import { VEILED_BALANCE_CHUNK_SIZE } from "../../src/core/crypto/veiled/consts";
import { ed25519GenListOfRandom } from "../../src/core/crypto/utils";

describe("Generate 'veiled coin' proofs", () => {
  const ALICE_BALANCE = 70n;

  const aliceVeiledPrivateKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();
  const bobVeiledPrivateKey: TwistedEd25519PrivateKey = TwistedEd25519PrivateKey.generate();

  const aliceEncryptedBalance = amountToChunks(ALICE_BALANCE, VEILED_BALANCE_CHUNK_SIZE).map((el) =>
    new TwistedElGamal(aliceVeiledPrivateKey).encrypt(el),
  );

  const WITHDRAW_AMOUNT = 15n;
  const veiledWithdraw = new VeiledWithdraw(
    toTwistedEd25519PrivateKey(aliceVeiledPrivateKey),
    aliceEncryptedBalance,
    WITHDRAW_AMOUNT,
  );
  let veiledWithdrawSigmaProof: VeiledWithdrawSigmaProof;
  test("Generate withdraw sigma proof", async () => {
    await veiledWithdraw.init();

    veiledWithdrawSigmaProof = await veiledWithdraw.genSigmaProof();

    expect(veiledWithdrawSigmaProof).toBeDefined();
  });

  const balanceAfterWithdraw = ALICE_BALANCE - WITHDRAW_AMOUNT;
  const encryptedBalanceAfterWithdraw = amountToChunks(balanceAfterWithdraw, VEILED_BALANCE_CHUNK_SIZE).map((el) =>
    TwistedElGamal.encryptWithPK(el, aliceVeiledPrivateKey.publicKey()),
  );
  test("Verify withdraw sigma proof", async () => {
    const isValid = VeiledWithdraw.verifySigmaProof({
      twistedEd25519PublicKey: aliceVeiledPrivateKey.publicKey(),
      encryptedActualBalance: veiledWithdraw.encryptedActualBalance,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.encryptedActualBalanceAfterWithdraw!, // FIXME: does randomness matter?
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
      encryptedActualBalanceAfterWithdraw: encryptedBalanceAfterWithdraw,
    });

    expect(isValid).toBeTruthy();
  });

  const TRANSFER_AMOUNT = 10n;
  const veiledTransfer = new VeiledTransfer(
    aliceVeiledPrivateKey,
    aliceEncryptedBalance,
    TRANSFER_AMOUNT,
    bobVeiledPrivateKey.publicKey(),
  );
  let veiledTransferSigmaProof: VeiledTransferSigmaProof;
  test("Generate transfer sigma proof", async () => {
    await veiledTransfer.init();

    veiledTransferSigmaProof = await veiledTransfer.genSigmaProof();

    expect(veiledTransferSigmaProof).toBeDefined();
  });
  // const balanceAfterTransfer = ALICE_BALANCE - TRANSFER_AMOUNT;
  // // const encryptedBalanceAfterTransfer = amountToChunks(balanceAfterTransfer, VEILED_BALANCE_CHUNK_SIZE).map((el) =>
  // //   TwistedElGamal.encryptWithPK(el, aliceVeiledPrivateKey.publicKey()),
  // // );
  test("Verify transfer sigma proof", () => {
    const isValid = VeiledTransfer.verifySigmaProof({
      twistedEd25519PrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceEncryptedBalance,
      encryptedActualBalanceAfterTransfer: veiledTransfer.encryptedActualBalanceAfterTransfer!,
      encryptedAmountByRecipient: veiledTransfer.encryptedAmountByRecipient,
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
      encryptedActualBalanceAfterTransfer: veiledTransfer.encryptedActualBalanceAfterTransfer!,
      rangeProofAmount: veiledTransferRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const auditor = TwistedEd25519PrivateKey.generate();
  const veiledTransferWithAuditors = new VeiledTransfer(
    aliceVeiledPrivateKey,
    aliceEncryptedBalance,
    TRANSFER_AMOUNT,
    bobVeiledPrivateKey.publicKey(),
    [auditor.publicKey()],
  );
  let veiledTransferWithAuditorsSigmaProof: VeiledTransferSigmaProof;
  test("Generate transfer with auditors sigma proof", async () => {
    await veiledTransferWithAuditors.init();

    veiledTransferWithAuditorsSigmaProof = await veiledTransferWithAuditors.genSigmaProof();

    expect(veiledTransferWithAuditorsSigmaProof).toBeDefined();
  });
  test("Verify transfer with auditors sigma proof", () => {
    const isValid = VeiledTransfer.verifySigmaProof({
      twistedEd25519PrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceEncryptedBalance,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.encryptedActualBalanceAfterTransfer!,
      encryptedAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      sigmaProof: veiledTransferWithAuditorsSigmaProof,
      auditors: {
        publicKeys: [auditor.publicKey()],
        decryptionKeys: veiledTransferWithAuditors.auditorsDList,
      },
    });

    expect(isValid).toBeTruthy();
  });
  test("Should fail transfer sigma proof verification with wrong auditors", () => {
    const invalidAuditor = TwistedEd25519PrivateKey.generate();
    const newRandomness = ed25519GenListOfRandom();
    const auditorsDList = [invalidAuditor.publicKey()].map(publicKeyToU8).map((pk) => {
      const pkRist = RistrettoPoint.fromHex(pk);
      return newRandomness.map((r) => pkRist.multiply(r).toRawBytes());
    });

    const isValid = VeiledTransfer.verifySigmaProof({
      twistedEd25519PrivateKey: aliceVeiledPrivateKey,
      recipientPublicKey: bobVeiledPrivateKey.publicKey(),
      encryptedActualBalance: aliceEncryptedBalance,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.encryptedActualBalanceAfterTransfer!,
      encryptedAmountByRecipient: veiledTransferWithAuditors.encryptedAmountByRecipient,
      sigmaProof: veiledTransferWithAuditorsSigmaProof,
      auditors: {
        publicKeys: [invalidAuditor.publicKey()],
        decryptionKeys: auditorsDList,
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
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.encryptedActualBalanceAfterTransfer!,
      rangeProofAmount: veiledTransferWithAuditorsRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferWithAuditorsRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const newAliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
  const veiledKeyRotation = new VeiledKeyRotation(
    aliceVeiledPrivateKey,
    newAliceVeiledPrivateKey,
    aliceEncryptedBalance,
  );
  let veiledKeyRotationSigmaProof: VeiledKeyRotationSigmaProof;
  test("Generate key rotation sigma proof", async () => {
    await veiledKeyRotation.init();

    veiledKeyRotationSigmaProof = await veiledKeyRotation.genSigmaProof();

    expect(veiledKeyRotationSigmaProof).toBeDefined();
  });
  test("Verify key rotation sigma proof", () => {
    if (!veiledKeyRotation.newEncryptedBalance) throw new Error("newEncryptedBalance is not defined");

    const isValid = VeiledKeyRotation.verifySigmaProof({
      sigmaProof: veiledKeyRotationSigmaProof,
      currPublicKey: aliceVeiledPrivateKey.publicKey(),
      newPublicKey: newAliceVeiledPrivateKey.publicKey(),
      currEncryptedBalance: aliceEncryptedBalance,
      newEncryptedBalance: veiledKeyRotation.newEncryptedBalance,
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
      newEncryptedBalance: veiledKeyRotation.newEncryptedBalance!,
    });

    expect(isValid).toBeTruthy();
  });

  const unnormalizedAliceBalanceChunks = [2n ** 32n + 100n, 2n ** 32n + 200n, 2n ** 32n + 300n, 0n];
  const unnormalizedEncryptedBalanceAlice = unnormalizedAliceBalanceChunks.map((chunk) =>
    TwistedElGamal.encryptWithPK(chunk, aliceVeiledPrivateKey.publicKey()),
  );
  const veiledNormalization = new VeiledNormalization(
    aliceVeiledPrivateKey,
    unnormalizedEncryptedBalanceAlice,
    chunksToAmount(unnormalizedAliceBalanceChunks),
  );
  let veiledNormalizationSigmaProof: VeiledNormalizationSigmaProof;
  test("Generate normalization sigma proof", async () => {
    await veiledNormalization.init();

    veiledNormalizationSigmaProof = await veiledNormalization.genSigmaProof();

    expect(veiledNormalizationSigmaProof).toBeDefined();
  });
  test("Verify normalization sigma proof", () => {
    if (!veiledNormalization.normalizedEncryptedBalance) throw new Error("normalizedEncryptedBalance is not defined");

    const isValid = VeiledNormalization.verifySigmaProof({
      publicKey: aliceVeiledPrivateKey.publicKey(),
      sigmaProof: veiledNormalizationSigmaProof,
      unnormilizedEncryptedBalance: unnormalizedEncryptedBalanceAlice,
      normalizedEncryptedBalance: veiledNormalization.normalizedEncryptedBalance,
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
      normalizedEncryptedBalance: veiledNormalization.normalizedEncryptedBalance!,
    });

    expect(isValid).toBeTruthy();
  });
});
