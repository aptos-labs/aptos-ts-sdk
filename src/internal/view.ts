// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { AptosConfig } from "../api/aptosConfig";
import { Serializer } from "../bcs";
import { postAptosFullNode } from "../client";
import { LedgerVersionArg, MimeType, MoveValue, ViewRequest } from "../types";
import { generateViewFunctionPayload, InputViewFunctionData } from "../transactions";

export async function view<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, payload, options } = args;

  const viewFunction = await generateViewFunctionPayload({ ...payload, aptosConfig });
  const serializer = new Serializer();
  viewFunction.serialize(serializer);
  const body = serializer.toUint8Array();

  const { data } = await postAptosFullNode<ViewRequest, MoveValue[]>({
    aptosConfig,
    originMethod: "view",
    path: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    params: { ledger_version: options?.ledgerVersion },
    body,
  });

  return data as T;
}
