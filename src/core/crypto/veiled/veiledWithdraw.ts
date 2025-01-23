import {
  bytesToNumberLE,
  concatBytes,
  hexToNumber,
  numberToBytesBE,
  numberToBytesLE,
} from "@noble/curves/abstract/utils";
import { RistrettoPoint } from "@noble/curves/ed25519";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";
import { genFiatShamirChallenge, publicKeyToU8 } from "./helpers";
import { H_RISTRETTO, TwistedEd25519PrivateKey, TwistedEd25519PublicKey } from "../twistedEd25519";
import { TwistedElGamalCiphertext } from "../twistedElGamal";
import { PROOF_CHUNK_SIZE, SIGMA_PROOF_WITHDRAW_SIZE } from "./consts";
import { ed25519GenListOfRandom, ed25519GenRandom, ed25519InvertN, ed25519modN } from "../utils";
import { RangeProofExecutor } from "../rangeProof";
import { VeiledAmount } from "./veiledAmount";

export type VeiledWithdrawSigmaProof = {
  alpha1: Uint8Array;
  alpha2: Uint8Array;
  alpha3: Uint8Array;
  alpha4List: Uint8Array[];
  alpha5List: Uint8Array[];
  X1: Uint8Array;
  X2: Uint8Array;
  X3List: Uint8Array[];
  X4List: Uint8Array[];
};

export type CreateVeiledWithdrawOpArgs = {
  decryptionKey: TwistedEd25519PrivateKey;
  encryptedActualBalance: TwistedElGamalCiphertext[];
  amountToWithdraw: bigint;
  randomness?: bigint[];
};

export class VeiledWithdraw {
  decryptionKey: TwistedEd25519PrivateKey;

  encryptedActualBalanceAmount: TwistedElGamalCiphertext[];

  veiledAmountToWithdraw: VeiledAmount;

  veiledAmountAfterWithdraw: VeiledAmount;

  randomness: bigint[];

  constructor(args: {
    decryptionKey: TwistedEd25519PrivateKey;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    veiledAmountToWithdraw: VeiledAmount;
    veiledAmountAfterWithdraw: VeiledAmount;
    randomness: bigint[];
  }) {
    this.decryptionKey = args.decryptionKey;
    this.encryptedActualBalanceAmount = args.encryptedActualBalance;

    this.veiledAmountToWithdraw = args.veiledAmountToWithdraw;

    this.randomness = args.randomness;

    this.veiledAmountAfterWithdraw = args.veiledAmountAfterWithdraw;
  }

  static async create(args: CreateVeiledWithdrawOpArgs) {
    const randomness = args.randomness ?? ed25519GenListOfRandom(VeiledAmount.CHUNKS_COUNT);

    const veiledAmountToWithdraw = VeiledAmount.fromAmount(args.amountToWithdraw, {
      chunksCount: VeiledAmount.CHUNKS_COUNT / 2,
    });
    const actualBalance = await VeiledAmount.fromEncrypted(args.encryptedActualBalance, args.decryptionKey);

    const veiledAmountAfterWithdraw = VeiledAmount.fromAmount(actualBalance.amount - veiledAmountToWithdraw.amount);
    veiledAmountAfterWithdraw.encrypt(args.decryptionKey.publicKey(), randomness);

    return new VeiledWithdraw({
      decryptionKey: args.decryptionKey,
      encryptedActualBalance: args.encryptedActualBalance,
      veiledAmountToWithdraw,
      veiledAmountAfterWithdraw,
      randomness,
    });
  }

  static FIAT_SHAMIR_SIGMA_DST = "AptosVeiledCoin/WithdrawalProofFiatShamir";

  static serializeSigmaProof(sigmaProof: VeiledWithdrawSigmaProof): Uint8Array {
    return concatBytes(
      sigmaProof.alpha1,
      sigmaProof.alpha2,
      sigmaProof.alpha3,
      ...sigmaProof.alpha4List,
      ...sigmaProof.alpha5List,
      sigmaProof.X1,
      sigmaProof.X2,
      ...sigmaProof.X3List,
      ...sigmaProof.X4List,
    );
  }

  static deserializeSigmaProof(sigmaProof: Uint8Array): VeiledWithdrawSigmaProof {
    if (sigmaProof.length !== SIGMA_PROOF_WITHDRAW_SIZE) {
      throw new Error(
        `Invalid sigma proof length of veiled withdraw: got ${sigmaProof.length}, expected ${SIGMA_PROOF_WITHDRAW_SIZE}`,
      );
    }

    const proofArr: Uint8Array[] = [];
    for (let i = 0; i < SIGMA_PROOF_WITHDRAW_SIZE; i += PROOF_CHUNK_SIZE) {
      proofArr.push(sigmaProof.subarray(i, i + PROOF_CHUNK_SIZE));
    }

    const alpha1 = proofArr[0];
    const alpha2 = proofArr[1];
    const alpha3 = proofArr[2];
    const alpha4List = proofArr.slice(3, 3 + VeiledAmount.CHUNKS_COUNT);
    const alpha5List = proofArr.slice(7, 7 + VeiledAmount.CHUNKS_COUNT);
    const X1 = proofArr[11];
    const X2 = proofArr[12];
    const X3List = proofArr.slice(13, 13 + VeiledAmount.CHUNKS_COUNT);
    const X4List = proofArr.slice(17);

    return {
      alpha1,
      alpha2,
      alpha3,
      alpha4List,
      alpha5List,
      X1,
      X2,
      X3List,
      X4List,
    };
  }

  async genSigmaProof(): Promise<VeiledWithdrawSigmaProof> {
    if (this.randomness && this.randomness.length !== VeiledAmount.CHUNKS_COUNT) {
      throw new Error("Invalid length list of randomness");
    }

    const x1 = bytesToNumberLE(hexToBytes("a9d5584c8e8aa2c202e4e4d00e1b0e09fc65bfd27bb76173f4c5399e165fd909")); // ed25519GenRandom();
    const x2 = bytesToNumberLE(hexToBytes("8298896b362589d77524b58d75823eaebc4f5018aec6c21fb0deaac71876260c")); // ed25519GenRandom();
    const x3 = bytesToNumberLE(hexToBytes("9287f9e659cea686adcd84d59c9b207435d69fc0be94eead281b4bccead5ee0d")); // ed25519GenRandom();

    const x4List = [
      bytesToNumberLE(hexToBytes("fab774f64ae62b682a2c26e7ceeaccbfaa508370446156a3ff68e86ef855fb03")),
      bytesToNumberLE(hexToBytes("375d4605de435e02d8534f199e9690e0a46c29232517c69604cdd8d0fdc7dc04")),
      bytesToNumberLE(hexToBytes("8c12c04b8e5eefae09531f68213b12b95948ba7012aeab1691bf158d4d5d5a0e")),
      bytesToNumberLE(hexToBytes("27059a801250d7bc87059c2fb09853cee513326e9f863d7439363a43dcb70f05")),
      bytesToNumberLE(hexToBytes("c15defc82724f31855361408de701d27b17bb5c95aa47a2e51dbf71cc34b610f")),
      bytesToNumberLE(hexToBytes("6e106f6f9ab8f6a9a710b87c09d8c3d2036aa08019fd55276f489fb85497780c")),
      bytesToNumberLE(hexToBytes("0e06c77dd53966d244c2b2f60691afd3a47c29453614c0355cd8908468ae9508")),
      bytesToNumberLE(hexToBytes("b770f889819ab6d44084520b6d40d24c867eab701b9f124d39754016785d510c")),
    ]; // ed25519GenListOfRandom(VeiledAmount.CHUNKS_COUNT);
    const x5List = [
      bytesToNumberLE(hexToBytes("b6a8aaf63f4b286817fb6666a86eb8aa3fadf66602bb168485401fcccc152207")),
      bytesToNumberLE(hexToBytes("c7634c57f7d913c4e95beefbabe9a5e1c104465118e440ef5db28f0507752904")),
      bytesToNumberLE(hexToBytes("00bb3206248fc203f84ea6f4c4fc9ac104ded13ab947eaf9e637e90a7746e804")),
      bytesToNumberLE(hexToBytes("749eb392009c8481fe3072ca51519bd7af5e2f3ee90508422de7e1a555ba860c")),
      bytesToNumberLE(hexToBytes("b33387b579bdff898b730ddf7322efe3e93e89a105910d855c96e4cbc95dcd06")),
      bytesToNumberLE(hexToBytes("2e97ce524f4c991774e5c1abee6dc389e108417a59ce9ac80a1f64aea3132e0e")),
      bytesToNumberLE(hexToBytes("6280b86e35aa182ff98bd6153eaa691a2cad842830b2d307ccaf6bf9f0efed0c")),
      bytesToNumberLE(hexToBytes("110721bf31628cc352392304a8980ec79fd37681e9ad5be6206b077da779a60f")),
    ]; // ed25519GenListOfRandom(VeiledAmount.CHUNKS_COUNT);

    const toAlphaHex = (number: bigint) => bytesToHex(numberToBytesBE(number, 32));

    console.log("\n\n\n\n\n\n\n");
    console.log("x1G", RistrettoPoint.BASE.multiply(x1).toHex());
    console.log(this.encryptedActualBalanceAmount.map((el) => `${el.D.toHex()}:${el.C.toHex()}`));
    console.log("\n\n\n\n\n\n\n");

    const X1 = RistrettoPoint.BASE.multiply(x1).add(
      this.encryptedActualBalanceAmount.reduce((acc, el, i) => {
        const { D } = el;
        const coef = 2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI);

        const res = acc.add(D.multiply(coef)).multiply(x2);
        console.log(`[${i}]: {D: ${D.toHex()}, coef: ${coef}, ref: ${res}`);
        return res;
      }, RistrettoPoint.ZERO),
    );
    const X2 = H_RISTRETTO.multiply(x3);
    const X3List = x4List.map((item, index) =>
      RistrettoPoint.BASE.multiply(item).add(H_RISTRETTO.multiply(x5List[index])),
    );
    const X4List = x5List.map((item) =>
      RistrettoPoint.fromHex(this.decryptionKey.publicKey().toUint8Array()).multiply(item),
    );

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
      concatBytes(...this.veiledAmountToWithdraw.amountChunks.map((a) => numberToBytesLE(a, 32))),
      this.decryptionKey.publicKey().toUint8Array(),
      concatBytes(...this.encryptedActualBalanceAmount.map((el) => el.serialize()).flat()),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      X1.toRawBytes(),
      X2.toRawBytes(),
      ...X3List.map((el) => el.toRawBytes()),
      ...X4List.map((el) => el.toRawBytes()),
    );

    const sLE = bytesToNumberLE(this.decryptionKey.toUint8Array());
    const invertSLE = ed25519InvertN(sLE);

    const pt = ed25519modN(p * this.veiledAmountAfterWithdraw.amount);
    const ps = ed25519modN(p * sLE);
    const psInvert = ed25519modN(p * invertSLE);

    const alpha1 = ed25519modN(x1 - pt);
    const alpha2 = ed25519modN(x2 - ps);
    const alpha3 = ed25519modN(x3 - psInvert);
    const alpha4List = x4List.map((x4, i) => {
      const pChunk = ed25519modN(p * this.veiledAmountAfterWithdraw.amountChunks[i]);
      return ed25519modN(x4 - pChunk);
    });
    const alpha5List = x5List.map((x5, i) => {
      const pRand = ed25519modN(p * this.randomness[i]);
      return ed25519modN(x5 - pRand);
    });

    console.log({
      // 2e256dbd3c01e2eed1f19ed5653d4f7a0627e0a87b271b65309b7a522abfaa8
      alpha1: toAlphaHex(alpha1),
      // d5be2886316d4b18b18ad6f3debe29edb7ed0d2e1f9336b48a83badf6214681
      alpha2: toAlphaHex(alpha2),
      // 6ca82c63ae2acc2f19bf08a5e029433cacf9e2378efb774436c313e63aa6983
      alpha3: toAlphaHex(alpha3),
      /*
    '8a00a621b5ed538cb1f935eb8fe3b005c315e11ddd3605025cf4fc523a2059',
    'd7bcfc0b1a9813a6cffe8c6b0339770442f9bf246cb2c530805200666ce6e1b',
    '6f965106de673c6ece57fb3fdc4732507d24696f2a38eae5c83d79c50524f83',
    'daebf9f240aea6f4a775840fb3c3eb131f29e045d17de02c27e2c3ae222160b',
    '8005385fdc88f8704b475fc56bfa67c75dd7c53929871f9c6879d35cd819ab8',
    '5179f17996ffca4fd8fcebb0daa94cf2183e37f073c4c4c578b31a874014d65',
    '134b62b65618c920bf9e5d7d233a770226f9c7c8136fde97ffab2e382594305',
    '4f0653af711296f234c70bcfdb5a9519b924be295d6bfe5824b138f8e8aadae'
    * */
      alpha4List: alpha4List.map((el) => toAlphaHex(el)),
      /*
        '5f304d18a31bfcb8b1b8cb3ca169cdef961306b5f96a3b545476182e8d78157',
        'd902ac67b106c1bab325958e25219065c948a5f7764b55110b0a5dbba7c8d3b',
        '42d5abd8a55d295c4d105fc206df8afe46eb6408f5db2e5e9094d0d28a48163',
        '5a06de7dbd2da752a1210c6c9cd7a08d9d0fba4f0bbc8d01989aab995143486',
        '36b13b9a8de7528d156f24c4b6ced4180f6b0dfe636aa9ad33367a4ba668360',
        'ab8e48967c509098cd3bc4cb70fc4850aaee1d4884d89a3e1df22a8e50781a',
        '2ac56cc1e0860db3ec9bb349959979ae538ca8a452009d317fda7ba4d4c1172',
        '9d373d156f633ea6790678b7ea0d8d6a7aa149aa9944d5c5555e4193f353520'
        * */
      alpha5List: alpha5List.map((el) => toAlphaHex(el)),
      // '0xee5ea38a9e2461d94a932f31773db2075a3e3e6dcdd58608a4e8a24183321007'
      X1: X1.toHex(),
      // '0x68b25da54b2e9948ea3b4aefd0fc11ccbd52c077244db31718069544efe4b45a'
      X2: X2.toHex(),
      /*
        'da4efda6ed902ae3d304c1bfca116f05eb424d353e4756110d69002209e2086d',
        '06b19bbee2c85843cbe50534bc75fae1f3a7a74154102192ebf73cdf8df40d56',
        '620a47b85404984be0c73fd5630f771ad6291b3530c00e3e87982391f0fc8c61',
        'f0829d613bfb1ebe4a48ee090b29facbdb928e0c1df3f409b65fe8ca55050144',
        '2811252f8d87de8ce1346822626529cad6296184d2aa1610f6a3e6c4be815b60',
        '7637210f186483d00b53f3016481da0fe55306531af29a6196377efb22584f12',
        '806b12a4e28d6e4882ef9d936245ed1ba178791ef5b316b5ed1484a6d1326136',
        'a487907e250e06bb7f414cb02977b3bc45dc26b64b1ce0b42ff900ea9b884867'
        * */
      X3List: X3List.map((el) => el.toHex()),
      /*
        'dc91f754590fc45c351c4c8981b70a6bf2df5c2e05568347a7ba1b2d133e3620',
        'de31972718d3452d1a20ef7609729c740993832ff4bcf07a622d0d488a88f13f',
        'fc7dc04f96f60897d48204d5a4a88ce30439670a96369328e1f75bdb28044b56',
        'c2c497154168e08cf1406308c90e22484dbe20dc3f46b6fcd62c0090e035a139',
        '62d5f3e40255e18f338c87b8f0615d01a20c6adb888a5714624763681801f60f',
        '58c1826d42097999710856ad5928ed11c04a9b1ecf8d47171884483d89216134',
        '125524ed184cc22e8955ff208a7784285d44985b79c472a36a324419c60d316a',
        '6cc5a950279b6fd08051db6b9880197ab4f0fd16a5144b8757ec5c63d7d1f50e'
        * */
      X4List: X4List.map((el) => el.toHex()),
    });

    return {
      alpha1: numberToBytesLE(alpha1, 32),
      alpha2: numberToBytesLE(alpha2, 32),
      alpha3: numberToBytesLE(alpha3, 32),
      alpha4List: alpha4List.map((el) => numberToBytesLE(el, 32)),
      alpha5List: alpha5List.map((el) => numberToBytesLE(el, 32)),
      X1: X1.toRawBytes(),
      X2: X2.toRawBytes(),
      X3List: X3List.map((el) => el.toRawBytes()),
      X4List: X4List.map((el) => el.toRawBytes()),
    };
  }

  static verifySigmaProof(opts: {
    sigmaProof: VeiledWithdrawSigmaProof;
    encryptedActualBalance: TwistedElGamalCiphertext[];
    encryptedActualBalanceAfterWithdraw: TwistedElGamalCiphertext[];
    publicKey: TwistedEd25519PublicKey;
    amountToWithdraw: bigint;
  }): boolean {
    const publicKeyU8 = publicKeyToU8(opts.publicKey);
    const veiledAmountToWithdraw = VeiledAmount.fromAmount(opts.amountToWithdraw, {
      chunksCount: VeiledAmount.CHUNKS_COUNT / 2,
    });

    const alpha1LE = bytesToNumberLE(opts.sigmaProof.alpha1);
    const alpha2LE = bytesToNumberLE(opts.sigmaProof.alpha2);
    const alpha3LE = bytesToNumberLE(opts.sigmaProof.alpha3);
    const alpha4LEList = opts.sigmaProof.alpha4List.map((a) => bytesToNumberLE(a));
    const alpha5LEList = opts.sigmaProof.alpha5List.map((a) => bytesToNumberLE(a));

    const p = genFiatShamirChallenge(
      utf8ToBytes(VeiledWithdraw.FIAT_SHAMIR_SIGMA_DST),
      ...veiledAmountToWithdraw.amountChunks.map((a) => numberToBytesLE(a, 32)),
      publicKeyU8,
      ...opts.encryptedActualBalance.map((el) => el.serialize()).flat(),
      RistrettoPoint.BASE.toRawBytes(),
      H_RISTRETTO.toRawBytes(),
      opts.sigmaProof.X1,
      opts.sigmaProof.X2,
      ...opts.sigmaProof.X3List,
      ...opts.sigmaProof.X4List,
    );

    const { DOldSum, COldSum } = opts.encryptedActualBalance.reduce(
      (acc, { C, D }, i) => {
        const coef = 2n ** (BigInt(i) * VeiledAmount.CHUNK_BITS_BI);
        return {
          DOldSum: acc.DOldSum.add(D.multiply(coef)),
          COldSum: acc.COldSum.add(C.multiply(coef)),
        };
      },
      { DOldSum: RistrettoPoint.ZERO, COldSum: RistrettoPoint.ZERO },
    );

    const X1 = RistrettoPoint.BASE.multiply(alpha1LE)
      .add(DOldSum.multiply(alpha2LE))
      .add(COldSum.multiply(p))
      .subtract(RistrettoPoint.BASE.multiply(p).multiply(veiledAmountToWithdraw.amount));
    const X2 = H_RISTRETTO.multiply(alpha3LE).add(RistrettoPoint.fromHex(publicKeyU8).multiply(p));

    const X3List = alpha4LEList.map((a, i) => {
      const aG = RistrettoPoint.BASE.multiply(a);
      const aH = H_RISTRETTO.multiply(alpha5LEList[i]);
      const pC = opts.encryptedActualBalanceAfterWithdraw![i].C.multiply(p);
      return aG.add(aH).add(pC);
    });
    const X4List = alpha5LEList.map((a, i) =>
      RistrettoPoint.fromHex(publicKeyU8).multiply(a).add(opts.encryptedActualBalanceAfterWithdraw[i].D.multiply(p)),
    );

    console.log("X1", X1.toHex(), bytesToHex(opts.sigmaProof.X1));

    console.log(
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)),
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)),
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))),
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i]))),
    );

    return (
      X1.equals(RistrettoPoint.fromHex(opts.sigmaProof.X1)) &&
      X2.equals(RistrettoPoint.fromHex(opts.sigmaProof.X2)) &&
      X3List.every((X3, i) => X3.equals(RistrettoPoint.fromHex(opts.sigmaProof.X3List[i]))) &&
      X4List.every((X4, i) => X4.equals(RistrettoPoint.fromHex(opts.sigmaProof.X4List[i])))
    );
  }

  async genRangeProof() {
    const rangeProof = await Promise.all(
      this.veiledAmountAfterWithdraw.amountChunks.map((chunk, i) =>
        RangeProofExecutor.generateRangeZKP({
          v: chunk,
          r: numberToBytesLE(this.randomness[i], 32),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: this.veiledAmountAfterWithdraw.amountEncrypted![i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: VeiledAmount.CHUNK_BITS,
        }),
      ),
    );

    return rangeProof.map((el) => el.proof);
  }

  async authorizeWithdrawal(): Promise<
    [
      {
        sigmaProof: VeiledWithdrawSigmaProof;
        rangeProof: Uint8Array[];
      },
      TwistedElGamalCiphertext[],
    ]
  > {
    const sigmaProof = await this.genSigmaProof();
    const rangeProof = await this.genRangeProof();

    return [{ sigmaProof, rangeProof }, this.veiledAmountAfterWithdraw.amountEncrypted!];
  }

  static async verifyRangeProof(opts: {
    rangeProof: Uint8Array[];
    encryptedActualBalanceAfterWithdraw: TwistedElGamalCiphertext[];
  }) {
    const rangeProofVerificationResults = await Promise.all(
      opts.rangeProof.map((proof, i) =>
        RangeProofExecutor.verifyRangeZKP({
          proof,
          commitment: opts.encryptedActualBalanceAfterWithdraw[i].C.toRawBytes(),
          valBase: RistrettoPoint.BASE.toRawBytes(),
          // randBase: opts.encryptedActualBalanceAfterWithdraw[i].D.toRawBytes(),
          randBase: H_RISTRETTO.toRawBytes(),
          bits: VeiledAmount.CHUNK_BITS,
        }),
      ),
    );

    return rangeProofVerificationResults.every((isValid) => isValid);
  }
}
