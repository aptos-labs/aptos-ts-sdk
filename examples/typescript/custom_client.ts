/* eslint-disable no-console */

/**
 * Example to demonstrate how one can config the SDK to use a custom client.
 *
 * The SDK by default supports fetch client on web environment and got client on node environment
 * with http2 support.
 *
 * Need to provide a function with the signature
 * `<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>>;`
 *
 */
import { Aptos, AptosConfig, ClientResponse, ClientRequest, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();
// eslint-disable-next-line import/no-commonjs
const superagent = require("superagent");

// Default to devnet, but allow for overriding
const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];

export async function superagentCustomClient<Req, Res>(
  requestOptions: ClientRequest<Req>,
): Promise<ClientResponse<Res>> {
  const { params, method, url, headers, body } = requestOptions;

  const customHeaders: any = {
    ...headers,
    customClient: true,
  };

  const request = {
    headers: customHeaders,
    body: JSON.stringify(body),
    method,
  };

  let path = url;
  if (params) {
    path = `${url}?${params}`;
  }

  const response = await superagent.get(path, request);
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.text,
    headers: response.headers,
    config: response,
    request,
  };
}

const example = async () => {
  console.log("This example demonstrate how one can config for a custom client to be used by the SDK");

  async function withSuperagentClient() {
    const config = new AptosConfig({ network: APTOS_NETWORK, client: { provider: superagentCustomClient } });
    const aptos = new Aptos(config);

    console.log(`\nclient being used ${config.client.provider.name}`);

    const chainInfo = await aptos.getLedgerInfo();
    console.log(`${chainInfo}`);
  }

  // Call the inner function
  await withSuperagentClient();
};

example();
