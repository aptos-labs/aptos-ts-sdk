import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bytesToNumberLE, hexToNumber, numberToBytesLE } from "@noble/curves/abstract/utils";
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
  RangeProofExecutor,
  VeiledAmount,
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

  const aliceVeiledAmount = VeiledAmount.fromAmount(ALICE_BALANCE);
  aliceVeiledAmount.encrypt(aliceVeiledDecryptionKey.publicKey(), [
    bytesToNumberLE(hexToBytes("ab056c9544b16ab4d0d91fd1391560fcc648f4f0fa30fa6ba8fefee20747ce00")),
    bytesToNumberLE(hexToBytes("e6b5c4e45c2a5bff86fd907b18be3ecfdf00c9bc22f3f34ac875f2abf16c9504")),
    bytesToNumberLE(hexToBytes("d10db9cf2155610881db268031ad2f8981ac917fbfa97b8b055b3fc09aa2a306")),
    bytesToNumberLE(hexToBytes("c9027a3ddc9badd22b8ec19b6ebb92d10ebf8cccfc63757f867f39659b0fc307")),
    bytesToNumberLE(hexToBytes("92020f8533ba97650848287357f788929a5893279cd1a940de8da96254affe0b")),
    bytesToNumberLE(hexToBytes("190d344b71402f86e16956d42685ddfc4ff6cd84f3896af0ef6708df5fafd00a")),
    bytesToNumberLE(hexToBytes("8fc95adedbe58d1b6b85bf48675aa744496e1c71fcc035b285ed8662a530f101")),
    bytesToNumberLE(hexToBytes("ccb1cadb09e4336c1a57d9322ed1425d792c68f9583572774e4cc313ffa99e07")),
  ]);

  const WITHDRAW_AMOUNT = 2n ** 16n;
  let veiledWithdraw: VeiledWithdraw;
  let veiledWithdrawSigmaProof: VeiledWithdrawSigmaProof;
  test("Generate withdraw sigma proof", async () => {
    veiledWithdraw = await VeiledWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(aliceVeiledDecryptionKey),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      amountToWithdraw: WITHDRAW_AMOUNT,
      randomness: [
        bytesToNumberLE(hexToBytes("dd43034642d08b766de44e8a72ac5f7fa851c6c776e56e4e5988f0ba862c6104")),
        bytesToNumberLE(hexToBytes("43fb9b5910d069fc84f33623647bfa74a56bd74f1c33727d30102e812ee60e02")),
        bytesToNumberLE(hexToBytes("7fe0b1381353403c9af6ed7c39032c7ac9f89f84e7534d95e803d04f6942270e")),
        bytesToNumberLE(hexToBytes("b40219a5882a5f44f88a5eb19715eeac3d5bf1edb29fec76bfe76b9b63156b06")),
        bytesToNumberLE(hexToBytes("746bfd4884002d44a07761b8dede1976b6bfe6a1bfadb5b0882ef283b7c2e90d")),
        bytesToNumberLE(hexToBytes("d8c10948d8f0dbc8a075e0fc580af7a4b8ef01133ed1b6fbc4eabf6210c00500")),
        bytesToNumberLE(hexToBytes("43899f061536344fc294c2f70b43249d4a73fbc9524830b072494853d5a59502")),
        bytesToNumberLE(hexToBytes("b87da5499accba8457acd8026c739a0f20da5db0f0e051f55b3eba81e2336204")),
      ],
    });

    veiledWithdrawSigmaProof = await veiledWithdraw.genSigmaProof();

    expect(veiledWithdrawSigmaProof).toBeDefined();
  });

  test("Verify withdraw sigma proof", async () => {
    const isValid = VeiledWithdraw.verifySigmaProof({
      publicKey: aliceVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: veiledWithdraw.encryptedActualBalanceAmount,
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.veiledAmountAfterWithdraw!.amountEncrypted!,
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
      encryptedActualBalanceAfterWithdraw: veiledWithdraw.veiledAmountAfterWithdraw!.amountEncrypted!,
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
    const newAliceBalance = VeiledAmount.fromAmount(2n ** 64n + 10n);
    newAliceBalance.encrypt(newAliceDecryptionKey.publicKey());

    const amountToWithdraw = 2n ** 16n + 10n - 10n;

    const largeVeiledWithdrawal = await VeiledWithdraw.create({
      decryptionKey: toTwistedEd25519PrivateKey(newAliceDecryptionKey),
      encryptedActualBalance: newAliceBalance.amountEncrypted!,
      amountToWithdraw,
    });

    const [{ sigmaProof, rangeProof }, vbNew] = await largeVeiledWithdrawal.authorizeWithdrawal();

    expect(sigmaProof).toBeDefined();
    expect(rangeProof).toBeDefined();
    expect(vbNew).toBeDefined();

    const isSigmaProofValid = VeiledWithdraw.verifySigmaProof({
      publicKey: newAliceDecryptionKey.publicKey(),
      encryptedActualBalance: largeVeiledWithdrawal.encryptedActualBalanceAmount,
      encryptedActualBalanceAfterWithdraw: largeVeiledWithdrawal.veiledAmountAfterWithdraw.amountEncrypted!,
      amountToWithdraw,
      sigmaProof,
    });

    const isRangeProofValid = VeiledWithdraw.verifyRangeProof({
      rangeProof,
      encryptedActualBalanceAfterWithdraw: largeVeiledWithdrawal.veiledAmountAfterWithdraw.amountEncrypted!,
    });

    expect(isSigmaProofValid).toBeTruthy();
    expect(isRangeProofValid).toBeTruthy();
  });

  const TRANSFER_AMOUNT = 10n;
  let veiledTransfer: VeiledTransfer;
  let veiledTransferSigmaProof: VeiledTransferSigmaProof;
  test("Generate transfer sigma proof", async () => {
    veiledTransfer = await VeiledTransfer.create({
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
    const isValid = VeiledTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransfer.veiledAmountAfterTransfer?.amountEncrypted!,
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
      encryptedActualBalanceAfterTransfer: veiledTransfer.veiledAmountAfterTransfer!.amountEncrypted!,
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
    const isValid = VeiledTransfer.verifySigmaProof({
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.amountEncrypted!,
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
      senderPrivateKey: aliceVeiledDecryptionKey,
      recipientPublicKey: bobVeiledDecryptionKey.publicKey(),
      encryptedActualBalance: aliceVeiledAmount.amountEncrypted!,
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.amountEncrypted!,
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
      encryptedActualBalanceAfterTransfer: veiledTransferWithAuditors.veiledAmountAfterTransfer!.amountEncrypted!,
      rangeProofAmount: veiledTransferWithAuditorsRangeProofs.rangeProofAmount,
      rangeProofNewBalance: veiledTransferWithAuditorsRangeProofs.rangeProofNewBalance,
    });

    expect(isValid).toBeTruthy();
  });

  const newAliceVeiledPrivateKey = TwistedEd25519PrivateKey.generate();
  let veiledKeyRotation: VeiledKeyRotation;
  let veiledKeyRotationSigmaProof: VeiledKeyRotationSigmaProof;
  test("Generate key rotation sigma proof", async () => {
    veiledKeyRotation = await VeiledKeyRotation.create({
      currDecryptionKey: toTwistedEd25519PrivateKey(aliceVeiledDecryptionKey),
      currEncryptedBalance: aliceVeiledAmount.amountEncrypted!,
      newDecryptionKey: toTwistedEd25519PrivateKey(newAliceVeiledPrivateKey),
    });

    veiledKeyRotationSigmaProof = await veiledKeyRotation.genSigmaProof();

    expect(veiledKeyRotationSigmaProof).toBeDefined();
  });
  test("Verify key rotation sigma proof", () => {
    console.log(aliceVeiledAmount.amountChunks);
    const isValid = VeiledKeyRotation.verifySigmaProof({
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
    const isValid = VeiledKeyRotation.verifyRangeProof({
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

  const unnormalizedAliceVeiledAmount = VeiledAmount.fromChunks([
    ...Array.from({ length: VeiledAmount.CHUNKS_COUNT - 1 }, () => 2n ** VeiledAmount.CHUNK_BITS_BI + 100n),
    0n,
  ]);
  unnormalizedAliceVeiledAmount.encrypt(aliceVeiledDecryptionKey.publicKey());
  // const unnormalizedAliceBalanceChunks = [2n ** 32n + 100n, 2n ** 32n + 200n, 2n ** 32n + 300n, 0n];
  // const unnormalizedEncryptedBalanceAlice = unnormalizedAliceBalanceChunks.map((chunk) =>
  //   TwistedElGamal.encryptWithPK(chunk, aliceVeiledPrivateKey.publicKey()),
  // );
  let veiledNormalization: VeiledNormalization;
  let veiledNormalizationSigmaProof: VeiledNormalizationSigmaProof;
  test("Generate normalization sigma proof", async () => {
    veiledNormalization = await VeiledNormalization.create({
      decryptionKey: aliceVeiledDecryptionKey,
      unnormalizedEncryptedBalance: unnormalizedAliceVeiledAmount.amountEncrypted!,
      balanceAmount: unnormalizedAliceVeiledAmount.amount,
    });

    veiledNormalizationSigmaProof = await veiledNormalization.genSigmaProof();

    expect(veiledNormalizationSigmaProof).toBeDefined();
  });
  test("Verify normalization sigma proof", () => {
    const isValid = VeiledNormalization.verifySigmaProof({
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
    const isValid = VeiledNormalization.verifyRangeProof({
      rangeProof: veiledNormalizationRangeProof,
      normalizedEncryptedBalance: veiledNormalization.normalizedVeiledAmount!.amountEncrypted!,
    });

    expect(isValid).toBeTruthy();
  });
});
