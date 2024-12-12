import { AptosConfig } from "../api/aptosConfig";
import { AccountAddressInput, AccountAddress } from "../core";
import { PaginationArgs, OrderByArg, GetObjectDataQueryResponse, WhereArg } from "../types";
import { GetObjectDataQuery } from "../types/generated/operations";
import { GetObjectData } from "../types/generated/queries";
import { CurrentObjectsBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

/**
 * Retrieves the current objects based on specified filtering and pagination options.
 *
 * @param args - The arguments for retrieving object data.
 * @param args.aptosConfig - The configuration settings for Aptos.
 * @param [args.options] - Optional parameters for pagination and filtering.
 * @param [args.options.offset] - The number of items to skip before starting to collect the result set.
 * @param [args.options.limit] - The maximum number of items to return.
 * @param [args.options.orderBy] - The criteria for ordering the results.
 * @param [args.options.where] - The conditions to filter the results.
 * @returns The current objects that match the specified criteria.
 * @group Implementation
 */
export async function getObjectData(args: {
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

/**
 * Retrieves the object data associated with a specific object address.
 * This function allows you to access detailed information about an object in the Aptos blockchain.
 *
 * @param args - The arguments for retrieving object data.
 * @param args.aptosConfig - The configuration for connecting to the Aptos blockchain.
 * @param args.objectAddress - The address of the object whose data is being retrieved.
 * @param args.options - Optional parameters for pagination and ordering of the results.
 * @group Implementation
 */
export async function getObjectDataByObjectAddress(args: {
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
