// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { LedgerVersionArg, MimeType, MoveValue } from "../types";
import { AptosConfig } from "../api/aptosConfig";
import {
  generateViewFunctionPayload,
  InputViewFunctionData,
  InputViewFunctionJsonData,
  ViewFunctionJsonPayload,
} from "../transactions";
import { Serializer } from "../bcs";
import { postAptosFullNode } from "../client";

export async function view<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, payload, options } = args;
  const viewFunctionPayload = await generateViewFunctionPayload({
    ...payload,
    aptosConfig,
  });

  const serializer = new Serializer();
  viewFunctionPayload.serialize(serializer);
  const bytes = serializer.toUint8Array();

  const { data } = await postAptosFullNode<Uint8Array, MoveValue[]>({
    aptosConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });

  return data as T;
}

export async function viewJson<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionJsonData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, payload, options } = args;
  const { data } = await postAptosFullNode<ViewFunctionJsonPayload, MoveValue[]>({
    aptosConfig,
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
