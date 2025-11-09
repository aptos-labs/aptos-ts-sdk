import { defineBcsStruct, Deserializer, Serializer, WithSerializable, AnyNumber } from '@aptos-labs/bcs';

type U256Data = {
    value: bigint
}

export type U256 = WithSerializable<U256Data>
export const U256 = defineBcsStruct({
    create(value: AnyNumber) {
        const bigIntValue = BigInt(value)
        return {
            value: bigIntValue,
            serialize(s: Serializer) {
                s.serializeU256(bigIntValue)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU256()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU256(value)
            }
        }   
    }
})

