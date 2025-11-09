import { defineBcsStruct, Deserializer, Serializer, WithSerializable, AnyNumber } from '@aptos-labs/bcs';

type U128Data = {
    value: bigint
}

export type U128 = WithSerializable<U128Data>
export const U128 = defineBcsStruct({
    create(value: AnyNumber) {
        const bigIntValue = BigInt(value)
        return {
            value: bigIntValue,
            serialize(s: Serializer) {
                s.serializeU128(bigIntValue)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU128()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU128(value)
            }
        }   
    }
})

