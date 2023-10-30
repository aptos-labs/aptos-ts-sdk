// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, Aptos, AptosConfig, Network, SigningSchemeInput, U64 } from "../../../src";
import { fetchABIs } from "../../../src/abi/abi-gen";
import { FUND_AMOUNT } from "../../unit/helper";
import { publishArgumentTestModule } from "../transaction/helper";

describe("abi test", () => {
    it("parses abis correctly", async() => {
        const aptos = new Aptos(new AptosConfig({ network: Network.LOCAL }));
        const account = Account.generate();
        await aptos.fundAccount({accountAddress: account.accountAddress.toString(), amount: FUND_AMOUNT});
        const publishResponse = await publishArgumentTestModule(aptos, account);
        const fetchABIsResponse = await fetchABIs(aptos, account);
        fetchABIsResponse.forEach((abi) => {
            console.log(abi);
        });
    });
});