import type { GetAptosFullNode } from "./types";

type RegisteredClient = {
  getAptosFullNode: GetAptosFullNode;
};

let registeredClient: RegisteredClient | undefined;

export function registerNetworkClient(client: RegisteredClient): void {
  registeredClient = client;
}

export function getRegisteredNetworkClient(): RegisteredClient {
  if (!registeredClient) {
    throw new Error(
      "No Aptos network client registered. Please import @aptos-labs/ts-client or register a network client via registerNetworkClient.",
    );
  }
  return registeredClient;
}
