import { AptosApiType, AnyNumber, ClientConfig, Client, MimeType, Network } from "@aptos-labs/ts-types";
import type { AptosResponse } from "@aptos-labs/ts-types";

/**
 * Minimal interface describing the network configuration that cryptography helpers expect.
 * Implementations (such as the `AptosConfig` class in ts-client) can satisfy this structurally.
 */
export interface AptosConfigLike {
  network: Network;
  client: Client;
  clientConfig?: ClientConfig;
  fullnodeConfig?: ClientConfig;
  getRequestUrl(apiType: AptosApiType): string;
}

export type GetAptosRequestOptions = {
  aptosConfig: AptosConfigLike;
  type: AptosApiType;
  originMethod: string;
  path: string;
  contentType?: MimeType;
  acceptType?: MimeType;
  params?: Record<string, string | AnyNumber | boolean | undefined>;
  overrides?: ClientConfig;
};

export type GetAptosFullNode = <Req extends {}, Res extends {}>(
  options: GetAptosRequestOptions,
) => Promise<AptosResponse<Req, Res>>;
