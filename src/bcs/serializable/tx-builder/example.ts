// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { Account, AccountAddress } from "../../../core";
import { EntryFunction, Identifier, ModuleId, TransactionPayloadEntryFunction } from "../../../transactions";
import { Network } from "../../../utils/apiEndpoints";
import { MoveVector } from "../moveStructs";
import { SingleSignerTransactionBuilder } from "./singleSignerTransactionBuilder";
import { CreateTransactionBuilderArgs } from "./types";

export class CreateResourceAccountAndPublishPackage extends SingleSignerTransactionBuilder {
    constructor(args: Omit<CreateTransactionBuilderArgs, "payload"> & {
            seed: Uint8Array,
            metadata: Uint8Array,
            bytecode: Array<Uint8Array>, // each array is the bytecode for a module
    }) {
        super({
            ...args,
            // payload below should really just come from `CreateResourceAccountAndPublishPackagePayload` class in `0x1.ts`
            payload: new TransactionPayloadEntryFunction(new EntryFunction(
                new ModuleId(AccountAddress.ONE, new Identifier("account")),
                new Identifier("create_resource_account_and_publish_package"),
                [],
                [
                    MoveVector.U8(args.seed),
                    MoveVector.U8(args.metadata),
                    new MoveVector(args.bytecode.map((bytecode) => MoveVector.U8(bytecode))),
                ]                
            )),
        });
    }
}

const main = async() => {
    const craappTransactionBuilder = new CreateResourceAccountAndPublishPackage({
        sender: AccountAddress.ONE,
        seed: new Uint8Array(),
        metadata: new Uint8Array(),
        bytecode: [new Uint8Array()],
        configOrNetwork: Network.TESTNET,
        options: {},
    }); // with fee payer too?

    await craappTransactionBuilder.sign(Account.generate());
    await craappTransactionBuilder.signSubmitAndWaitForResponse({ signer: Account.generate() });

    const sender = Account.generate();
    const feePayer = Account.generate();
    const payload = {} as any;
    const network = Network.TESTNET;
    const options = {} as any;

    const myTransaction = await SingleSignerTransactionBuilder.createWithExplicitFeePayer({
        sender: sender.accountAddress,
        feePayerAddress: feePayer.accountAddress,
        payload: payload,
        configOrNetwork: network,
        options?: options,
    });

    myTransaction.sign(sender);
    myTransaction.sign(feePayer);
    myTransaction.submit();
    const response = myTransaction.waitForResponse();
}