// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unused-vars */
import { MoveStructType, MoveAbility, MoveFunctionGenericTypeParam } from "../../src/types/types";

test("should create a basic Move struct type", () => {
  const basicStruct: MoveStructType = {
    type: "0x1::coin::CoinStore",
    fields: {
      coin: "0x1::coin::Coin",
      frozen: "bool",
      deposit_events: "0x1::event::EventHandle",
      withdraw_events: "0x1::event::EventHandle",
    },
  };

  expect(basicStruct.type).toBe("0x1::coin::CoinStore");
  expect(basicStruct.fields).toBeDefined();
  expect(Object.keys(basicStruct.fields).length).toBe(4);
  expect(basicStruct.fields.coin).toBe("0x1::coin::Coin");
  expect(basicStruct.fields.frozen).toBe("bool");
});

test("should create a Move struct type with generic parameters", () => {
  const genericTypeParams: Array<MoveFunctionGenericTypeParam> = [
    {
      constraints: [MoveAbility.STORE, MoveAbility.DROP],
    },
  ];

  const genericStruct: MoveStructType = {
    type: "0x1::option::Option",
    fields: {
      vec: "vector<T>",
    },
    genericTypeParams,
  };

  expect(genericStruct.genericTypeParams).toBeDefined();
  expect(genericStruct.genericTypeParams?.length).toBe(1);
  expect(genericStruct.genericTypeParams?.[0].constraints).toContain(MoveAbility.STORE);
  expect(genericStruct.genericTypeParams?.[0].constraints).toContain(MoveAbility.DROP);
});

test("should create a Move struct type with abilities", () => {
  const structWithAbilities: MoveStructType = {
    type: "0x1::coin::Coin",
    fields: {
      value: "u64",
    },
    abilities: [MoveAbility.STORE, MoveAbility.KEY],
  };

  expect(structWithAbilities.abilities).toBeDefined();
  expect(structWithAbilities.abilities?.length).toBe(2);
  expect(structWithAbilities.abilities).toContain(MoveAbility.STORE);
  expect(structWithAbilities.abilities).toContain(MoveAbility.KEY);
});

test("should handle complex struct type with nested fields", () => {
  const complexStruct: MoveStructType = {
    type: "0x1::account::Account",
    fields: {
      authentication_key: "vector<u8>",
      sequence_number: "u64",
      guid_creation_num: "u64",
      coin_register_events: "0x1::event::EventHandle",
      rotation_capability_offer: {
        type: "0x1::account::CapabilityOffer",
        fields: {
          for: "address",
        },
      },
    },
  };

  expect(complexStruct.type).toBe("0x1::account::Account");
  expect(complexStruct.fields.authentication_key).toBe("vector<u8>");
  expect((complexStruct.fields.rotation_capability_offer as MoveStructType).type).toBe(
    "0x1::account::CapabilityOffer",
  );
  expect((complexStruct.fields.rotation_capability_offer as MoveStructType).fields.for).toBe("address");
});

test("should create a Move struct type with all optional properties", () => {
  const fullStruct: MoveStructType = {
    type: "0x1::table::Table",
    fields: {
      handle: "address",
      length: "u64",
    },
    genericTypeParams: [
      {
        constraints: [MoveAbility.COPY, MoveAbility.DROP],
      },
      {
        constraints: [MoveAbility.STORE],
      },
    ],
    abilities: [MoveAbility.STORE, MoveAbility.DROP],
  };

  expect(fullStruct).toMatchObject({
    type: "0x1::table::Table",
    fields: {
      handle: "address",
      length: "u64",
    },
    genericTypeParams: [
      {
        constraints: [MoveAbility.COPY, MoveAbility.DROP],
      },
      {
        constraints: [MoveAbility.STORE],
      },
    ],
    abilities: [MoveAbility.STORE, MoveAbility.DROP],
  });
}); 
