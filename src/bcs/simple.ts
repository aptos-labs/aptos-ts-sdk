import { AccountAddress } from "../core";
import { EntryFunctionArgumentTypes } from "../transactions";
import { SimpleEntryFunctionArgumentTypes } from "../transactions";
import { TypeTag, TypeTagBool, TypeTagU16, TypeTagU8, TypeTagU32, TypeTagU64, TypeTagU128, TypeTagU256, TypeTagAddress } from "../transactions/typeTag";
import { Bool, U16, U8, U32, U64, U128, U256 } from "./serializable/movePrimitives";

export function encode(typeTag: TypeTag, arg: SimpleEntryFunctionArgumentTypes): EntryFunctionArgumentTypes {
    if (isTypeTagBool(typeTag)) {
        if (typeof arg === "boolean") {
            return new Bool(arg);
        }
        // Accept number 1/0
        if (typeof arg === "number" && (arg === 1 || arg === 0)) {
            return new Bool(arg === 1);
        }
        // Accept string '1'/'0'
        if (typeof arg === "string" && (arg === "1" || arg === "0")) {
            return new Bool(arg === "1");
        }
        throw new Error(`Cannot serialize argument as bool: ${arg}`);
    } else if (isTypeTagU8(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**8 - 1)) {
            return new U8(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u8: ${arg}`);
    } else if (isTypeTagU16(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**16 - 1)) {
            return new U16(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u16: ${arg}`);
    } else if (isTypeTagU32(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**32 - 1)) {
            return new U32(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u32: ${arg}`);
    } else if (isTypeTagU64(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**64 - 1)) {
            return new U64(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u64: ${arg}`);
    } else if (isTypeTagU128(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**128 - 1)) {
            return new U128(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u128: ${arg}`);
    } else if (isTypeTagU256(typeTag)) {
        if (isValidUInt(arg as number | string | bigint, 2**256 - 1)) {
            return new U256(Number(arg));
        }
        throw new Error(`Cannot serialize argument as u256: ${arg}`);
    } else if (isTypeTagAddress(typeTag)) {
        if (typeof arg === "string") {
            return AccountAddress.from(arg);
        }
        throw new Error(`Cannot serialize argument as address: ${arg}`);
    }
    // TODO: Implement other types
    throw new Error(`Cannot serialize argument for typeTag: ${typeTag}`);
}

export function decode(typeTag: TypeTag, arg: EntryFunctionArgumentTypes): SimpleEntryFunctionArgumentTypes {
    if (isTypeTagBool(typeTag)) {
        if (arg instanceof Bool) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as bool: ${arg}`);
    } else if (isTypeTagU8(typeTag)) {
        if (arg instanceof U8) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u8: ${arg}`);
    } else if (isTypeTagU16(typeTag)) {
        if (arg instanceof U16) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u16: ${arg}`);
    } else if (isTypeTagU32(typeTag)) {
        if (arg instanceof U32) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u32: ${arg}`);
    } else if (isTypeTagU64(typeTag)) {
        if (arg instanceof U64) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u64: ${arg}`);
    } else if (isTypeTagU128(typeTag)) {
        if (arg instanceof U128) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u128: ${arg}`);
    } else if (isTypeTagU256(typeTag)) {
        if (arg instanceof U256) {
            return arg.value;
        }
        throw new Error(`Cannot deserialize argument as u256: ${arg}`);
    } else if (isTypeTagAddress(typeTag)) {
        if (arg instanceof AccountAddress) {
            return arg.toString();
        }
        throw new Error(`Cannot deserialize argument as address: ${arg}`);
    }
    // TODO: Implement other types
    throw new Error(`Cannot deserialize argument for typeTag: ${typeTag}`);
}

function isTypeTagBool(typeTag: TypeTag): typeTag is TypeTagBool {
    return typeTag instanceof TypeTagBool;
}

function isTypeTagU8(typeTag: TypeTag): typeTag is TypeTagU8 {
    return typeTag instanceof TypeTagU8;
}

function isTypeTagU16(typeTag: TypeTag): typeTag is TypeTagU16 {
    return typeTag instanceof TypeTagU16;
}

function isTypeTagU32(typeTag: TypeTag): typeTag is TypeTagU32 {
    return typeTag instanceof TypeTagU32;
}

function isTypeTagU64(typeTag: TypeTag): typeTag is TypeTagU64 {
    return typeTag instanceof TypeTagU64;
}

function isTypeTagU128(typeTag: TypeTag): typeTag is TypeTagU128 {
    return typeTag instanceof TypeTagU128;
}

function isTypeTagU256(typeTag: TypeTag): typeTag is TypeTagU256 {
    return typeTag instanceof TypeTagU256;
}

function isTypeTagAddress(typeTag: TypeTag): typeTag is TypeTagAddress {
    return typeTag instanceof TypeTagAddress;
}

function isValidUInt(arg: number | string | bigint, upperBound: number): boolean {
    if (typeof arg === "number") {
        return Number.isInteger(arg) && arg >= 0 && arg <= upperBound;
    } else if (typeof arg === "string") {
        const num = parseInt(arg, 10);
        return !isNaN(num) && Number.isInteger(num) && num >= 0 && num <= upperBound;
    } else if (typeof arg === "bigint") {
        return arg >= BigInt(0) && arg <= BigInt(upperBound);
    }
    return false;
}
