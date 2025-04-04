// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable max-len */

import {
  ClientRequest,
  ClientResponse,
  Deserializer,
  Ed25519PrivateKey,
  EphemeralKeyPair,
  Groth16VerificationKey,
  Hex,
  KeylessConfiguration,
  MoveJWK,
  ZeroKnowledgeSig,
} from "../../src";

export const FUND_AMOUNT = 100_000_000;
export const TRANSFER_AMOUNT = 500_000;

export const EPHEMERAL_KEY_PAIR = new EphemeralKeyPair({
  privateKey: new Ed25519PrivateKey("ed25519-priv-0x1111111111111111111111111111111111111111111111111111111111111111"),
  expiryDateSecs: 9876543210, // Expires Friday, December 22, 2282 8:13:30 PM GMT
  blinder: new Uint8Array(31),
});

export const EXPIRED_EPHEMERAL_KEY_PAIR = new EphemeralKeyPair({
  privateKey: new Ed25519PrivateKey("ed25519-priv-0x1111111111111111111111111111111111111111111111111111111111111111"),
  expiryDateSecs: 10,
  blinder: new Uint8Array(31),
});

export const wallet = {
  address: "0x07968dab936c1bad187c60ce4082f307d030d780e91e694ae03aef16aba73f30",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/0'",
  privateKey: "ed25519-priv-0x5d996aa76b3212142792d9130796cd2e11e3c445a93118c08414df4f66bc60ec",
  publicKey: "0xea526ba1710343d953461ff68641f1b7df5f23b9042ffa2d2a798d3adb3f3d6c",
};

export const Ed25519WalletTestObject = {
  address: "0x28b829b524d7c24aa7fd8916573c814df766dae542f724e1cf8914536232c346",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/0'",
  privateKey: "ed25519-priv-0x5d996aa76b3212142792d9130796cd2e11e3c445a93118c08414df4f66bc60ec",
  publicKey: "0xea526ba1710343d953461ff68641f1b7df5f23b9042ffa2d2a798d3adb3f3d6c",
};

export const secp256k1WalletTestObject = {
  address: "0x4b4aa8759fcef40ba49e999409eb73a98252f44f6612a4de2b23bad5c37b15a6",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0/0",
  privateKey: "secp256k1-priv-0x1eec55afc2f72c4ab7b46c84d761739035ac420a2b6b22cef3411adaf91ce1f7",
  publicKey:
    "0x04913871f1d6cb7b867e8671cf63cf7b4c43819539fa0074ff933434bf20bab825b335535251f720fff72fd8b567e414af84aacf2f26ec804562081f2e0b0c9478",
};

export const zeroWallet = {
  address: "0x00fe71257b6b4caca517ef4c9979ada97aa2e2688e950654a40ff82e98f68163",
  mnemonic: "shoot island position soft burden budget tooth cruel issue economy destroy above",
  path: "m/44'/637'/0'/0'/44'",
  privateKey: "ed25519-priv-0xeb70332d79a384f57052b34282748be65a57548513b3b99ee1bd858244b36d28",
  publicKey: "0xeb70332d79a384f57052b34282748be65a57548513b3b99ee1bd858244b36d28",
};

export const ed25519 = {
  privateKey: "ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  privateKeyHex: "0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5",
  publicKey: "0xde19e5d1880cac87d57484ce9ed2e84cf0f9599f12e7cc3a52e4e7657a763f2c",
  authKey: "0x978c213990c4833df71548df7ce49d54c759d6b6d932de22b24d56060b7af2aa",
  address: "0x978c213990c4833df71548df7ce49d54c759d6b6d932de22b24d56060b7af2aa",
  daa: "0xcebd25623966b16691a0bfc2307e0997cf83fcd30dab6be23b56f622ba668127",
  messageEncoded: "68656c6c6f20776f726c64",
  stringMessage: "hello world",
  signatureHex:
    "0x9e653d56a09247570bb174a389e85b9226abd5c403ea6c504b386626a145158cd4efd66fc5e071c0e19538a96a05ddbda24d3c51e1e6a9dacc6bb1ce775cce07",
};

export const multiEd25519PkTestObject = {
  public_keys: [
    "b9c6ee1630ef3e711144a648db06bbb2284f7274cfbee53ffcee503cc1a49200",
    "aef3f4a4b8eca1dfc343361bf8e436bd42de9259c04b8314eb8e2054dd6e82ab",
    "8a5762e21ac1cdb3870442c77b4c3af58c7cedb8779d0270e6d4f1e2f7367d74",
  ],
  threshold: 2,
  bytesInStringWithoutPrefix:
    "b9c6ee1630ef3e711144a648db06bbb2284f7274cfbee53ffcee503cc1a49200aef3f4a4b8eca1dfc343361bf8e436bd42de9259c04b8314eb8e2054dd6e82ab8a5762e21ac1cdb3870442c77b4c3af58c7cedb8779d0270e6d4f1e2f7367d7402",
};

export const multiEd25519SigTestObject = {
  signatures: [
    "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a8805",
    "2ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102",
  ],
  bitmap: "c0000000",
  bytesInStringWithoutPrefix:
    "e6f3ba05469b2388492397840183945d4291f0dd3989150de3248e06b4cefe0ddf6180a80a0f04c045ee8f362870cb46918478cd9b56c66076f94f3efd5a88052ae0818b7e51b853f1e43dc4c89a1f5fabc9cb256030a908f9872f3eaeb048fb1e2b4ffd5a9d5d1caedd0c8b7d6155ed8071e913536fa5c5a64327b6f2d9a102c0000000",
};

export const keylessTestObject = {
  JWT: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtcnNhIn0.eyJpc3MiOiJ0ZXN0Lm9pZGMucHJvdmlkZXIiLCJhdWQiOiJ0ZXN0LWtleWxlc3MtZGFwcCIsInN1YiI6InRlc3QtdXNlci0wIiwiZW1haWwiOiJ0ZXN0QGFwdG9zbGFicy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWF0Ijo5ODc2NTQzMjA5LCJleHAiOjk4NzY1NDMyMTAsIm5vbmNlIjoiMTk2NDM2OTg4NjEyNjU1Njc4MDQ5MDk5MTMxMzA1MDcyNDc4MTQ1MjY5MTM1NzAyMjgzMTY0MTczNzc5NjUxMDU2ODE3OTYxNzMwOTgifQ.C6QG9WyEIAqYEiLkY8-5yqTKYtCzmnu2RM4P7iqr17toRXhL2ZqCiQYgE2TpY60RlOqBI7_aiHOlxJRvF_iQghEQQSWkgWhkcjVkSvBJW0IHm0IrSRl9ZytQHi6x0vPa8bUff5L--9JfxMiH27wOTrGtTA1n8Fz3G8JKQfYNQF2VawzytJu3lywduRj6pZw9-FFTgPqPsZWQvwhiX75Tgud976CpDusKOrPAM3rA9fXgKo_aTKeOPiEIm11ezI1bsOJ3B4JhsxLT5vszZ11Ywytst8XXwqWHjnulkJWjM9QfVUJhsO-jEQ5T_dYDqMVnnkdzjJyMRbvgbyNPUkvx8Q",
  ephemeralKeyPair: EPHEMERAL_KEY_PAIR,
  publicKey:
    "0x12746573742e6f6964632e70726f766964657220bdc98aab184dc40bbb5c483410ccac4c0b2ef20eeac8d568cf25125e9cdafc0f",
  iss: "test.oidc.provider",
  idCommitment: "0xbdc98aab184dc40bbb5c483410ccac4c0b2ef20eeac8d568cf25125e9cdafc0f",
  pepper: "0x772714089792b0bc8c621843bd88599627c74564c47cb4dc7bc0196914a56c",
  proof: ZeroKnowledgeSig.deserialize(
    new Deserializer(
      Hex.hexInputToUint8Array(
        "0x00ac1c3add4fa703c66a940e9e947a71bcdb8f30258e72460c01f63d6236d9b2a835188c3ac199bea3905270b9660ddafacbf4f9addb93a3e235e9703ca72c40258362273f596f93594499527ca4802ef40cf0166ba3bd2d65d1a7f50562060127dcdcd995f9ae5e193582cce456f3ddfe8c0c935719ad8636a8e777369279d5a480969800000000000000010040d6433ea43090d25fc4f4a15c362a98a5343dcf4e29e3854f3b74d0d99a0b43abd9955c55a7d20f47372a5802a0e26cc4f860969109d48c9e989dab8287c41501",
      ),
    ),
  ),
  address: "0x3d255a4ea36dfedc32205a522f440064fab38fb2d8cf727642d113cb8d43045f",
  authKey: "0x3d255a4ea36dfedc32205a522f440064fab38fb2d8cf727642d113cb8d43045f",
  messageEncoded: "68656c6c6f20776f726c64",
  stringMessage: "hello world",
  signatureHex:
    "0x000028edb9b770bd33823ed3aa95d6a464ee61a6370f3662f9edb205e1fad45e3c943296fed377bcece279bd6f68649fdab2f81ca3e83b34fce490492574e2943f04e4f9bfda70c4325e4567bcb58c1a7ccbd67ff9ba618e03be794be0483141bc15a436433070367193c102fbad99c1fed866e34b1f624d64ecfd818a09aa62a41b80969800000000000000010040119893806295fa773fa806a1f5e0754055f773e8a2ca72a0442c23945c004f011c3a03ed218f246e0d758032f16de78b9c93b6868b0b81bea083c114e6d855052c7b22616c67223a225253323536222c22747970223a224a5754222c226b6964223a22746573742d727361227dea16b04c020000000020d04ab232742bb4ab3a1368bd4615e4e6d0224ab71a016baf8520a332c97787370040be6bc1c26488a31fdb030ccd1546e0dcb6dd4ffbada797040deba21231ce894470f1aef38272fe4c77725e77945c6c3b67c6c16d29e2d3ccf4f30bf4374b0f08",
  jwk: MoveJWK.deserialize(
    new Deserializer(
      Hex.hexInputToUint8Array(
        "0x08746573742d727361035253410552533235360441514142d6027935456673315a7a69734c4c4b4341525376547a7467576a354a465033373738645a57742d6f643738666d4f5a4678656d33615f6159624f58534a546f5270383632646f3050784a3450444d706d7177563566374b706c4649364e737751562d57507566514838496148585a74755064436a504f634879626344694c6b4f31326430644736695a51557a79706a414a6636334150636164696f2d344a444e576c4743355f4f775f5851396c495937316b544d6954396c6b434364305a787145696647746e4a653578536f5a6f614d524b72766c4f772d523669566a4c557450416b356879555839354c444b787741522d6f73686e6a37676d4154656a676132457648396f7a646e334d38476f31315053446130344f517850634132354f6f445466784c765432384c5270535872626d55575a2d4f5f6c4774446c335a41746a4967755947456f62546b344e3131655273734339354377",
      ),
    ),
  ),
};

export const keylessTestConfig = new KeylessConfiguration({
  verificationKey: new Groth16VerificationKey({
    alphaG1: "0xe2f26dbea299f5223b646cb1fb33eadb059d9407559d7441dfd902e3a79a4d2d",
    betaG2:
      "0xabb73dc17fbc13021e2471e0c08bd67d8401f52b73d6d07483794cad4778180e0c06f33bbc4c79a9cadef253a68084d382f17788f885c9afd176f7cb2f036789",
    deltaG2:
      "0xb106619932d0ef372c46909a2492e246d5de739aa140e27f2c71c0470662f125219049cfe15e4d140d7e4bb911284aad1cad19880efb86f2d9dd4b1bb344ef8f",
    gammaAbcG1: [
      "0x6123b6fea40de2a7e3595f9c35210da8a45a7e8c2f7da9eb4548e9210cfea81a",
      "0x32a9b8347c512483812ee922dc75952842f8f3083edb6fe8d5c3c07e1340b683",
    ],
    gammaG2:
      "0xedf692d95cbdde46ddda5ef7d422436779445c5e66006a42761e1f12efde0018c212f3aeb785e49712e7a9353349aaf1255dfb31b7bf60723a480d9293938e19",
  }),
  trainingWheelsPubkey: "0x1388de358cf4701696bd58ed4b96e9d670cbbb914b888be1ceda6374a3098ed4",
});

export const secp256k1TestObject = {
  privateKey: "secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e",
  privateKeyHex: "0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e",
  publicKey:
    "0x04acdd16651b839c24665b7e2033b55225f384554949fef46c397b5275f37f6ee95554d70fb5d9f93c5831ebf695c7206e7477ce708f03ae9bb2862dc6c9e033ea",
  address: "0x5792c985bc96f436270bd2a3c692210b09c7febb8889345ceefdbae4bacfe498",
  authKey: "0x5792c985bc96f436270bd2a3c692210b09c7febb8889345ceefdbae4bacfe498",
  messageEncoded: "68656c6c6f20776f726c64",
  stringMessage: "hello world",
  signatureHex:
    "0xd0d634e843b61339473b028105930ace022980708b2855954b977da09df84a770c0b68c29c8ca1b5409a5085b0ec263be80e433c83fcf6debb82f3447e71edca",
};

export const singleSignerED25519 = {
  publicKey: "0xe425451a5dc888ac871976c3c724dec6118910e7d11d344b4b07a22cd94e8c2e",
  privateKey: "ed25519-priv-0xf508cbef4e0fe463204aab724a90791c9a9dbe60a53b4978bbddbc712b55f2fd",
  address: "0x5bdf77d5bf826c8c04273d4e7323f7bc4a85ee7ee34b37bd7458b7aed3639dd3",
  authKey: "0x5bdf77d5bf826c8c04273d4e7323f7bc4a85ee7ee34b37bd7458b7aed3639dd3",
  messageEncoded: "68656c6c6f20776f726c64", // "hello world"
  signatureHex:
    "0xc6f50f4e0cb1961f6f7b28be1a1d80e3ece240dfbb7bd8a8b03cc26bfd144fc176295d7c322c5bf3d9669d2ad49d8bdbfe77254b4a6393d8c49da04b40cee600",
};

export const multiKeyTestObject = {
  publicKeys: [
    // secp256k1
    "0x049a6f7caddff8064a7dd5800e4fb512bf1ff91daee965409385dfa040e3e63008ab7ef566f4377c2de5aeb2948208a01bcee2050c1c8578ce5fa6e0c3c507cca2",
    // ed25519
    "0x7a73df1afd028e75e7f9e23b2187a37d092a6ccebcb3edff6e02f93185cbde86",
    // ed25519
    "0x17fe89a825969c1c0e5f5e80b95f563a6cb6240f88c4246c19cb39c9535a1486",
  ],
  signaturesRequired: 2,
  address: "0x738a998ac1f69db4a91fc5a0152f792c98ad87354c65a2a842a118d7a17109b1",
  authKey: "0x738a998ac1f69db4a91fc5a0152f792c98ad87354c65a2a842a118d7a17109b1",
  bitmap: [160, 0, 0, 0],
  stringBytes:
    "0x030141049a6f7caddff8064a7dd5800e4fb512bf1ff91daee965409385dfa040e3e63008ab7ef566f4377c2de5aeb2948208a01bcee2050c1c8578ce5fa6e0c3c507cca200207a73df1afd028e75e7f9e23b2187a37d092a6ccebcb3edff6e02f93185cbde86002017fe89a825969c1c0e5f5e80b95f563a6cb6240f88c4246c19cb39c9535a148602",
};

export const longTestTimeout = 120 * 1000;

export async function customClient<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>> {
  const { params, method, url, headers, body } = requestOptions;

  const customHeaders: any = {
    ...headers,
    customClient: true,
  };

  const request = {
    headers: customHeaders,
    body:
      // weird fetch issue
      headers!["content-type"] === "application/x.aptos.signed_transaction+bcs" ? (body as any) : JSON.stringify(body),
    method,
  };

  const response = await fetch(`${url}?${params}`, request);
  const data = await response.json();
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    headers: response.headers,
    config: response,
    request,
  };
}
