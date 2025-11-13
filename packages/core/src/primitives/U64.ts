import { defineBcsStruct, Deserializer, Serializer, WithSerializable, AnyNumber } from '@aptos-labs/bcs';

type U64Data = {
    value: bigint
}

export type U64 = WithSerializable<U64Data>
export const U64 = defineBcsStruct({
    create(value: AnyNumber) {
        const bigIntValue = BigInt(value)
        return {
            value: bigIntValue,
            serialize(s: Serializer) {
                s.serializeU64(bigIntValue)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU64()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU64(value)
            }
        }   
    }
})

