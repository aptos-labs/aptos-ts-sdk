/**
 * Example to demonstrate how one can config the SDK to use a custom client.
 *
 * The SDK by default supports axios client on web environment and go client on node environment
 * with http2 support.
 *
 * Need to provide a function with the signature
 * `<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>>;`
 *
 */
import { Aptos, AptosConfig, ClientResponse, ClientRequest } from "aptos";
const superagent = require("superagent");

export async function fetchCustomClient<Req, Res>(requestOptions: ClientRequest<Req>): Promise<ClientResponse<Res>> {
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

  const response = await fetch(`${url}?${params}`, request);
  const data = await response.json();
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    headers: response.headers,
    config: response,
    request,
  };
}

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

  const response = await superagent.get(`${url}?${params}`, request);
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
  console.log("This example demonstrate how one can config for a custom client ot be used by the SDK");

  async function withSuperagentClient() {
    const config = new AptosConfig({ client: { provider: superagentCustomClient } });
    const aptos = new Aptos(config);

    console.log(`\nclient being used ${config.client.provider.name}`);

    const chainInfo = await aptos.getLedgerInfo();
    console.log(`${chainInfo}`);
  }

  async function withFetchClient() {
    const config = new AptosConfig({ client: { provider: fetchCustomClient } });
    const aptos = new Aptos(config);

    console.log(`\nclient being used ${config.client.provider.name}`);

    const chainInfo = await aptos.getLedgerInfo();
    console.log(`${JSON.stringify(chainInfo)}`);
  }

  // Call the inner functions
  await withSuperagentClient();
  await withFetchClient();
};

example();
