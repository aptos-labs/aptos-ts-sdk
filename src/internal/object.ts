import { AptosConfig } from "../api/aptosConfig";
import { AccountAddressInput, AccountAddress } from "../core";
import { PaginationArgs, OrderByArg, GetObjectDataQueryResponse, WhereArg } from "../types";
import { GetObjectDataQuery } from "../types/generated/operations";
import { GetObjectData } from "../types/generated/queries";
import { CurrentObjectsBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

export async

/**
 * Retrieves the current objects associated with the specified Aptos configuration.
 * This function allows you to query for specific objects based on various filtering and pagination options.
 * 
 * @param args - The arguments for the function.
 * @param args.aptosConfig - The configuration object for connecting to the Aptos network.
 * @param args.options - Optional parameters for pagination and filtering.
 * @param args.options.offset - The number of records to skip before starting to collect the result set.
 * @param args.options.limit - The maximum number of records to return.
 * @param args.options.orderBy - The criteria to order the results by.
 * @param args.options.where - Conditions to filter the results.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   const objectData = await aptos.getObjectData({
 *     aptosConfig: config,
 *     options: {
 *       limit: 10, // specify the number of records to return
 *       offset: 0, // specify the number of records to skip
 *       orderBy: { created_at: "desc" }, // specify the order of results
 *       where: { is_active: { _eq: true } } // filter to only active objects
 *     }
 *   });
 * 
 *   console.log(objectData); // Log the retrieved object data
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getObjectData(args: {
  aptosConfig: AptosConfig;
  options?: PaginationArgs & OrderByArg<GetObjectDataQueryResponse[0]> & WhereArg<CurrentObjectsBoolExp>;
}): Promise<GetObjectDataQueryResponse> {
  const { aptosConfig, options } = args;

  const graphqlQuery = {
    query: GetObjectData,
    variables: {
      where_condition: options?.where,
      offset: options?.offset,
      limit: options?.limit,
      order_by: options?.orderBy,
    },
  };
  const data = await queryIndexer<GetObjectDataQuery>({
    aptosConfig,
    query: graphqlQuery,
    originMethod: "getObjectData",
  });

  return data.current_objects;
}

export async

/**
 * Retrieves the data for a specific object identified by its address.
 * 
 * @param args - The parameters for the request.
 * @param args.aptosConfig - The configuration for the Aptos client.
 * @param args.objectAddress - The address of the object to retrieve data for.
 * @param args.options - Optional pagination and ordering arguments.
 * 
 * @example
 * ```typescript
 * import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
 * 
 * const config = new AptosConfig({ network: Network.TESTNET });
 * const aptos = new Aptos(config);
 * 
 * async function runExample() {
 *   // Retrieve data for a specific object address
 *   const objectAddress = "0x1"; // replace with a real object address
 * 
 *   const objectData = await aptos.object.getObjectDataByObjectAddress({
 *     aptosConfig: config,
 *     objectAddress: objectAddress,
 *   });
 * 
 *   console.log(objectData);
 * }
 * runExample().catch(console.error);
 * ```
 */
 function getObjectDataByObjectAddress(args: {
  aptosConfig: AptosConfig;
  objectAddress: AccountAddressInput;
  options?: PaginationArgs & OrderByArg<GetObjectDataQueryResponse[0]>;
}): Promise<GetObjectDataQueryResponse[0]> {
  const { aptosConfig, objectAddress, options } = args;
  const address = AccountAddress.from(objectAddress).toStringLong();

  const whereCondition: { object_address: { _eq: string } } = {
    object_address: { _eq: address },
  };
  return (await getObjectData({ aptosConfig, options: { ...options, where: whereCondition } }))[0];
}