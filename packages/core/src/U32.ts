import { defineBcsStruct, Deserializer, Serializer, WithSerializable } from '@aptos-labs/bcs';

type U32Data = {
    value: number
}

export type U32 = WithSerializable<U32Data>
export const U32 = defineBcsStruct({
    create(value: number) {
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU32(value)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeU32()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeU32(value)
            }
        }   
    }
})

