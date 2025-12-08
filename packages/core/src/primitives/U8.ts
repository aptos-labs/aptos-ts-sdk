import { defineBcsStruct, Deserializer, Serializer, WithSerializable } from '@aptos-labs/bcs';

type U8Data = {
    value: number
}

export type U8 = WithSerializable<U8Data>
export const U8 = defineBcsStruct({
    create(value: number) {
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU8(value)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU8()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU8(value)
            }
        }   
    }
})