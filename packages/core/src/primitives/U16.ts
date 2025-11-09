import { defineBcsStruct, Deserializer, Serializer, WithSerializable } from '@aptos-labs/bcs';

type U16Data = {
    value: number
}

export type U16 = WithSerializable<U16Data>
export const U16 = defineBcsStruct({
    create(value: number) {
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU16(value)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU16()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU16(value)
            }
        }   
    }
})

