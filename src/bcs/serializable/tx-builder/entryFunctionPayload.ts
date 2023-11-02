// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { Serializable, Serializer } from "../../serializer";
import { EntryFunctionArgsField } from "./types";

// Build the payload for them
export abstract class EntryFunctionPayload extends Serializable {
    abstract args: EntryFunctionArgsField;

    serialize(serializer: Serializer): void {
        Object.keys(this.args).forEach((field) => {
            const value = this.args[field as keyof typeof this.args];
            serializer.serialize(value);
        });
    }
}
