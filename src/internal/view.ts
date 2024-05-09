// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { LedgerVersionArg, MimeType, MoveValue } from "../types";
import { AptosConfig } from "../api/aptosConfig";
import {
  EntryFunction,
  EntryFunctionArgumentTypes,
  generateViewFunctionPayload,
  generateViewFunctionPayloadWithABI,
  generateViewFunctionPayloadWithNoABI,
  InputViewFunctionData,
  InputViewFunctionDataWithNoABI,
  InputViewFunctionDataWithRemoteABI,
  isEncodedEntryFunctionArgument,
} from "../transactions";
import { Serializer } from "../bcs";
import { ViewFunctionNotFoundError, postAptosFullNode } from "../client";

export async function view<T extends Array<MoveValue> = Array<MoveValue>>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg;
}): Promise<T> {
  const { aptosConfig, payload, options } = args;

  let viewFunctionPayload: EntryFunction;
  const { abi } = payload;

  // If the ABI is provided, we can skip the fetch ABI request and generate the payload.
  if (typeof abi !== "undefined") {
    viewFunctionPayload = generateViewFunctionPayloadWithABI({
      ...payload,
      abi,
    });
    // If the ABI isn't provided
  } else {
    // We can skip both the fetch ABI request and the ABI check if all function arguments are BCS-serializable.
    const everyFunctionArgumentIsEncoded = payload.functionArguments?.every(isEncodedEntryFunctionArgument);
    if (everyFunctionArgumentIsEncoded) {
      viewFunctionPayload = await generateViewFunctionPayloadWithNoABI({
        ...(payload as InputViewFunctionDataWithNoABI),
        functionArguments: payload.functionArguments as Array<EntryFunctionArgumentTypes>,
      });
      // Otherwise, we need to fetch the ABI and generate the payload.
    } else {
      try {
        viewFunctionPayload = await generateViewFunctionPayload({
          ...payload,
          aptosConfig,
        });
      } catch (e) {
        if (e instanceof ViewFunctionNotFoundError) {
          // Throw the same error with a more specific error message.
          const errorMsg =
            "Failed to generate view function payload with remote ABI." +
            "If the function is private, please either include the function ABI in the view function payload" +
            "or provide only BCS-serializable function arguments.";
          throw new ViewFunctionNotFoundError(errorMsg);
        } else {
          throw e;
        }
      }
    }
  }

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
