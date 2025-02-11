import { AptosConfig } from "../api/aptosConfig";
import { generateViewFunctionPayload, InputViewFunctionData } from "../transactions";
import { LedgerVersionArg, MimeType } from "../types";
import { Serializer } from "../bcs";
import { postBinaryAptosFullNode } from "../client";

export async function viewBinary(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg & { convert?: undefined };
}): Promise<Uint8Array>;

export async function viewBinary<T extends {}>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg & { convert?: (input: Uint8Array) => T };
}): Promise<T>;

/**
 * Reads a binary view function, and converts into the appropriate type if a converter is provided.
 * @experimental
 * @param args
 */
export async function viewBinary<T extends {} = Uint8Array>(args: {
  aptosConfig: AptosConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg & { convert?: (input: Uint8Array) => T };
}): Promise<Uint8Array | T> {
  const { aptosConfig, payload, options } = args;
  const viewFunctionPayload = await generateViewFunctionPayload({
    ...payload,
    aptosConfig,
  });

  const serializer = new Serializer();
  viewFunctionPayload.serialize(serializer);
  const bytes = serializer.toUint8Array();

  const { data } = await postBinaryAptosFullNode<Uint8Array>({
    aptosConfig,
    path: "view",
    originMethod: "view",
    contentType: MimeType.BCS_VIEW_FUNCTION,
    acceptType: MimeType.BCS,
    params: { ledger_version: options?.ledgerVersion },
    body: bytes,
  });

  const array = new Uint8Array(data);
  if (options?.convert) {
    return options.convert(array);
  }

  return array;
}
