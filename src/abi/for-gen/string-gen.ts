// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0
import { kindToSimpleTypeMap } from "../utils";

export const FOR_GENERATION_DIRECTORY = "for-gen";
export const PAYLOAD_BUILDERS_FILE_NAME = "payloadBuilders";
export const ABI_TYPES_FILE_NAME = "types";
export const ABI_TYPES_FILE = `"../${ABI_TYPES_FILE_NAME}"`;
export const ABI_PAYLOAD_BUILDER_FILE = `"../${PAYLOAD_BUILDERS_FILE_NAME}"`;

export const DEFAULT_ARGUMENT_BASE = "arg_";
export const R_PARENTHESIS = ")";

export const BOILERPLATE_COPYRIGHT =
  `` + `// Copyright © Aptos Foundation\n` + `// SPDX-License-Identifier: Apache-2.0\n`;
export const DEFAULT_SDK_PATH = "@aptos-labs/ts-sdk";

export const getBoilerplateImports = (sdkPath?: string): string => {
  return `
    ${BOILERPLATE_COPYRIGHT}
    
    /* eslint-disable max-len */
    import { AccountAddress, AccountAuthenticator, MoveString, MoveVector, TypeTag, U128, U16, U256, U32, U64, U8, Bool, Account } from "${
      sdkPath ?? DEFAULT_SDK_PATH
    }";
    import { EntryFunctionArgumentTypes, AccountAddressInput, Hex, HexInput, parseTypeTag } from "${
      sdkPath ?? DEFAULT_SDK_PATH
    }";
    import { InputTypes, ${
      kindToSimpleTypeMap.MoveOption
    }, MoveObject, ObjectAddress, TypeTagInput, Uint8, Uint16, Uint32, Uint64, Uint128, Uint256 } from ${ABI_TYPES_FILE};
    import { ViewFunctionPayloadBuilder, EntryFunctionPayloadBuilder } from ${ABI_PAYLOAD_BUILDER_FILE};
    
    `;
};
