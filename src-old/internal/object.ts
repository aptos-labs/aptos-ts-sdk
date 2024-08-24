import { AptosConfig } from "../api/aptosConfig";
import { AccountAddressInput, AccountAddress } from "../core";
import { PaginationArgs, OrderByArg, GetObjectDataQueryResponse, WhereArg } from "../types";
import { GetObjectDataQuery } from "../types/generated/operations";
import { GetObjectData } from "../types/generated/queries";
import { CurrentObjectsBoolExp } from "../types/generated/types";
import { queryIndexer } from "./general";

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
