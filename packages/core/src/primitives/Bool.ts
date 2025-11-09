import { defineBcsStruct, Deserializer, Serializer, WithSerializable } from '@aptos-labs/bcs';

type BoolData = {
    value: boolean
}

export type Bool = WithSerializable<BoolData>
export const Bool = defineBcsStruct({
    create(value: boolean) {
        return {
            value,
            serialize(s: Serializer) {
                s.serializeBool(value)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeBool()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeBool(value)
            }
        }   
    }
})

