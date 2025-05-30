import { pairedFaMetadataAddress } from "../../src/utils/helpers";
import { AccountAddress } from "../../src/core/accountAddress";

describe("pairedFaMetadataAddress", () => {
  test("matches the ground truth cases on chain", () => {
    // Test case 1: Cedra Coin should return APT_METADATA_ADDRESS_HEX
    expect(pairedFaMetadataAddress("0x1::cedra_coin::CedraCoin")).toEqual(AccountAddress.A);

    // Test case 2: Moon Coin should match the specific hash
    expect(
      pairedFaMetadataAddress(
        "0x66c34778730acbb120cefa57a3d98fd21e0c8b3a51e9baee530088b2e444e94c::moon_coin::MoonCoin",
      ),
    ).toEqual(AccountAddress.from("0xf772c28c069aa7e4417d85d771957eb3c5c11b5bf90b1965cda23b899ebc0384"));

    // Test case 3: THL Coin should match the specific hash
    expect(
      pairedFaMetadataAddress("0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL"),
    ).toEqual(AccountAddress.from("0x377adc4848552eb2ea17259be928001923efe12271fef1667e2b784f04a7cf3a"));

    // Test case 4: LP Coin with USDC and CedraCoin should match the specific hash
    expect(
      pairedFaMetadataAddress(
        "0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::lp_coin::LP<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0x1::cedra_coin::CedraCoin, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>",
      ),
    ).toEqual(AccountAddress.from("0xb7cc2781865ac4b29da6e0660f4cd00c0625cb47b37152405fc8ba2708867e54"));
  });

  test("handles standardization of input types", () => {
    // Test that leading zeros in addresses are handled correctly
    expect(pairedFaMetadataAddress("0x01::cedra_coin::CedraCoin")).toEqual(AccountAddress.A);
    expect(pairedFaMetadataAddress("0x001::cedra_coin::CedraCoin")).toEqual(AccountAddress.A);
  });

  test("handles various address formats", () => {
    const testCases = [
      // Simple forms
      {
        input: "0x1::cedra_coin::CedraCoin",
        expected: AccountAddress.A, // Special case for Cedra Coin
      },
      {
        input: "0x0000000000000000000000000000000000000000000000000000000000000001::cedra_coin::CedraCoin", // long form
        expected: AccountAddress.A,
      },
      {
        input: "0x00001::cedra_coin::CedraCoin", // with leading zeros
        expected: AccountAddress.A,
      },
      // Complex nested types
      {
        input: "0x1::coin::Coin<0x1412::a::struct<0x0001::cedra_coin::CedraCoin>>",
        expected: pairedFaMetadataAddress(
          "0x1::coin::Coin<0x1412::a::struct<0x1::cedra_coin::CedraCoin>>" as `0x${string}::${string}::${string}`,
        ),
      },
      {
        input: "0x1::coin::Coin<0x0001412::a::struct<0x1::cedra_coin::CedraCoin>>",
        expected: pairedFaMetadataAddress(
          "0x1::coin::Coin<0x1412::a::struct<0x1::cedra_coin::CedraCoin>>" as `0x${string}::${string}::${string}`,
        ),
      },
    ];

    for (const { input, expected } of testCases) {
      const result = pairedFaMetadataAddress(input as `0x${string}::${string}::${string}`);
      expect(result).toEqual(expected);
    }
  });

  test("normalizes addresses consistently in nested types", () => {
    const variations = [
      "0x1::coin::Coin<0x1412::a::struct<0x0001::cedra_coin::CedraCoin>>",
      "0x01::coin::Coin<0x001412::a::struct<0x1::cedra_coin::CedraCoin>>",
      "0x0001::coin::Coin<0x1412::a::struct<0x00001::cedra_coin::CedraCoin>>",
    ];

    // All variations should produce the same metadata address
    const results = variations.map((input) => pairedFaMetadataAddress(input as `0x${string}::${string}::${string}`));
    const firstResult = results[0];

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(firstResult);
    }
  });
});
