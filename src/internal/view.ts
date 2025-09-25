// Copyright © Cedra Foundation
// SPDX-License-Identifier: Apache-2.0

import { LedgerVersionArg, MimeType, MoveValue } from "../types";
import { CedraConfig } from "../api/cedraConfig";
import {
  generateViewFunctionPayload,
  InputViewFunctionData,
  InputViewFunctionJsonData,
  ViewFunctionJsonPayload,
} from "../transactions";
import { Serializer } from "../bcs";
import { getCedraFullNode, postCedraFullNode } from "../client";

export async function view<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  cedraConfig: CedraConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { cedraConfig, payload, options } = args;
  const viewFunctionPayload = await generateViewFunctionPayload({
    ...payload,
    cedraConfig,
  });

  const serializer = new Serializer();
  viewFunctionPayload.serialize(serializer);
  const bytes = serializer.toUint8Array();

  const { data } = await postCedraFullNode<Uint8Array, MoveValue[]>({
    cedraConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });

  return data as T;
}

export async function viewJson<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  cedraConfig: CedraConfig;
  payload: InputViewFunctionJsonData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { cedraConfig, payload, options } = args;
  const { data } = await postCedraFullNode<ViewFunctionJsonPayload, MoveValue[]>({
    cedraConfig,
    originMethod: "viewJson",
    path: "view",
    params: { ledger_version: options?.ledgerVersion },
    body: {
      function: payload.function,
      type_arguments: payload.typeArguments ?? [],
      arguments: payload.functionArguments ?? [],
    },
  });

  return data as T;
}

export async function getWhitelist<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  cedraConfig: CedraConfig;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { cedraConfig, options } = args;

  const { data } = await getCedraFullNode<Uint8Array, MoveValue[]>({
    cedraConfig,
    path: "whitelist",
    originMethod: "getWhitelist",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
  });

  return data as T;
}
