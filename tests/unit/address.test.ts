/* eslint-disable max-len */
import { AccountAddress } from "../../src";
import { createTokenAddress, createObjectAddress, createResourceAddress } from "../../src/core/account/utils/address";

describe("address", () => {
  /**
   * Reference: {@link https://explorer.aptoslabs.com/account/0xf0995d360365587c500cc171d1416bad10a331b9c71871a1aec5f2c37ff43124/modules/view/migration_helper/migration_object_address?network=testnet}
   * creatorAddr = 0x120e79e45d21ef439963580c77a023e2729db799e96e61f878fac98fde5b9cc9
   * seed = "migration::migration_contract"
   * Expect = 0xbe376272a5c4361ee96bc147525b26b3bf2ee25f433cbd410a7b3b4b881ffcbf
   */
  test("create an object address from creator address and seed as Uint8Array type", () => {
    const creatorAddress = AccountAddress.from("0x120e79e45d21ef439963580c77a023e2729db799e96e61f878fac98fde5b9cc9");
    const seed = Buffer.from("migration::migration_contract", "utf8");
    const address = createObjectAddress(creatorAddress, seed);
    expect(address.toString()).toEqual("0xbe376272a5c4361ee96bc147525b26b3bf2ee25f433cbd410a7b3b4b881ffcbf");
  });

  test("create an object address from creator address and seed as string type", () => {
    const creatorAddress = AccountAddress.from("0x120e79e45d21ef439963580c77a023e2729db799e96e61f878fac98fde5b9cc9");
    const seed = "migration::migration_contract";
    const address = createObjectAddress(creatorAddress, seed);
    expect(address.toString()).toEqual("0xbe376272a5c4361ee96bc147525b26b3bf2ee25f433cbd410a7b3b4b881ffcbf");
  });

  /**
   * Reference: {@link https://explorer.aptoslabs.com/txn/473081244/userTxnOverview?network=mainnet}
   * creatorAddr = 0x9d518b9b84f327eafc5f6632200ea224a818a935ffd6be5d78ada250bbc44a6
   * collectionName = SuperV Villains
   * tokenName = Nami #5962
   * Expect = 0x44697f48d1e1a899953b4ea6c03a92c567f3741f0b415a74d1c23cdf141368be
   */
  test("create token object address", () => {
    const creatorAddress = AccountAddress.from("0x9d518b9b84f327eafc5f6632200ea224a818a935ffd6be5d78ada250bbc44a6");
    const collectionName = "SuperV Villains";
    const tokenName = "Nami #5962";
    const address = createTokenAddress(creatorAddress, collectionName, tokenName);
    expect(address.toString()).toEqual("0x44697f48d1e1a899953b4ea6c03a92c567f3741f0b415a74d1c23cdf141368be");
  });

  /**
   * Reference: {@link https://explorer.aptoslabs.com/account/0x41e724e1d4fce6472ffcb5c9886770893eb49489e3f531d0aa97bf951e66d70c/modules/view/create_resource/create_resource?network=testnet}
   * creatorAddr = 0x41e724e1d4fce6472ffcb5c9886770893eb49489e3f531d0aa97bf951e66d70c
   * seed = "create_resource::create_resource"
   * Expect = 0x764cb760889d5ab6caabf0594d82adfbf0c0076f36268563e5209fa3734d7f3e
   */
  test("create resource account address", () => {
    const creatorAddress = AccountAddress.from("0x41e724e1d4fce6472ffcb5c9886770893eb49489e3f531d0aa97bf951e66d70c");
    const seed = Buffer.from("create_resource::create_resource", "utf8");
    const address = createResourceAddress(creatorAddress, seed);
    expect(address.toString()).toEqual("0x764cb760889d5ab6caabf0594d82adfbf0c0076f36268563e5209fa3734d7f3e");
  });
});
